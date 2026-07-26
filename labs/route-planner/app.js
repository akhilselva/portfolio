/**
 * Route Planner Lab
 * Calculates realistic driving routes via OSRM, fuel usage & cost,
 * and features arrival weather forecasts via OpenWeather APIs.
 * When OSRM cannot find a route, asks the user for total km and continues.
 */

// OpenWeather API Key Constant (Authorized for static deployment)
const OPENWEATHER_API_KEY = '9f0bff6ea85d68f247b56b169fb3cb2f';

// Minimum required cities
const MIN_CITIES = 2;

// Realistic road trip time multiplier (accounts for traffic, tolls & rest stops)
const REALISTIC_TIME_MULTIPLIER = 1.75;

// Estimated average driving speed when using manual distance (km/h)
const MANUAL_AVG_SPEED_KMH = 50;

// Track API Key validity state
let isApiKeyInvalid = false;

// Store geocoded cities for reuse when manual distance is submitted
let pendingGeocodedCities = null;
let pendingFormState = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  const routeForm = document.getElementById('route-form');
  const startTimeInput = document.getElementById('startTime');
  const addStopBtn = document.getElementById('add-stop-btn');
  const cityListContainer = document.getElementById('city-list');
  const manualSubmitBtn = document.getElementById('submit-manual-btn');

  // Set default start time to current local device time
  if (startTimeInput) {
    startTimeInput.value = getDefaultLocalDateTime();
  }

  // Add stop listener
  if (addStopBtn) {
    addStopBtn.addEventListener('click', () => {
      addCityRow();
    });
  }

  // Event delegation for remove buttons
  if (cityListContainer) {
    cityListContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-stop');
      if (removeBtn && !removeBtn.disabled) {
        const cityRow = removeBtn.closest('.city-row');
        if (cityRow) {
          cityRow.remove();
          updateCityIndices();
        }
      }
    });
  }

  // Form submission listener
  if (routeForm) {
    routeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideManualDistancePrompt();
      await handleFormSubmit();
    });
  }

  // Manual distance submission
  if (manualSubmitBtn) {
    manualSubmitBtn.addEventListener('click', async () => {
      await handleManualDistanceSubmit();
    });
  }

  // Allow Enter key in manual distance input
  const manualInput = document.getElementById('manualDistance');
  if (manualInput) {
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleManualDistanceSubmit();
      }
    });
  }
}

// ─────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────

function showManualDistancePrompt() {
  const prompt = document.getElementById('manual-distance-prompt');
  if (prompt) {
    prompt.style.display = 'block';
    const input = document.getElementById('manualDistance');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  }
}

function hideManualDistancePrompt() {
  const prompt = document.getElementById('manual-distance-prompt');
  if (prompt) prompt.style.display = 'none';
  const manualInput = document.getElementById('manualDistance');
  if (manualInput) manualInput.value = '';
  pendingGeocodedCities = null;
  pendingFormState = null;
}

// ─────────────────────────────────────────────
// City Row Management
// ─────────────────────────────────────────────

function getDefaultLocalDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function addCityRow() {
  const cityList = document.getElementById('city-list');
  const currentCount = cityList.querySelectorAll('.city-row').length;

  const newRow = document.createElement('div');
  newRow.className = 'city-row';
  newRow.dataset.index = currentCount;

  newRow.innerHTML = `
    <div class="city-row-header">
      <label for="city-${currentCount}" class="city-label">Stop ${currentCount + 1}</label>
    </div>
    <div class="city-input-wrapper">
      <span class="city-num-badge">${currentCount + 1}</span>
      <input type="text" id="city-${currentCount}" class="city-input" placeholder="e.g. Goa, IN" required autocomplete="off">
      <button type="button" class="btn-remove-stop" title="Remove stop" aria-label="Remove Stop ${currentCount + 1}">✕</button>
    </div>
  `;

  cityList.appendChild(newRow);
  updateCityIndices();

  const newInput = newRow.querySelector('.city-input');
  if (newInput) newInput.focus();
}

function updateCityIndices() {
  const cityRows = document.querySelectorAll('#city-list .city-row');
  const total = cityRows.length;

  cityRows.forEach((row, index) => {
    row.dataset.index = index;

    const label = row.querySelector('.city-label');
    const badge = row.querySelector('.city-num-badge');
    const input = row.querySelector('.city-input');
    const removeBtn = row.querySelector('.btn-remove-stop');

    let stopType = `Stop ${index + 1}`;
    if (index === 0) stopType += ' (Start)';
    else if (index === total - 1) stopType += ' (Destination)';

    if (label) { label.setAttribute('for', `city-${index}`); label.textContent = stopType; }
    if (badge) badge.textContent = index + 1;
    if (input) input.id = `city-${index}`;
    if (removeBtn) {
      removeBtn.setAttribute('aria-label', `Remove ${stopType}`);
      removeBtn.disabled = (total <= MIN_CITIES);
    }
  });
}

// ─────────────────────────────────────────────
// Form Submission
// ─────────────────────────────────────────────

async function handleFormSubmit() {
  clearErrors();
  isApiKeyInvalid = false;

  const mileageInput = document.getElementById('mileage');
  const petrolPriceInput = document.getElementById('petrolPrice');
  const startTimeInput = document.getElementById('startTime');
  const cityInputs = document.querySelectorAll('#city-list .city-input');

  const mileage = parseFloat(mileageInput.value);
  const petrolPrice = parseFloat(petrolPriceInput.value);
  const startTimeVal = startTimeInput.value;

  if (isNaN(mileage) || mileage <= 0) {
    showError('Please enter a valid positive fuel mileage (km/L).');
    mileageInput.focus();
    return;
  }
  if (isNaN(petrolPrice) || petrolPrice <= 0) {
    showError('Please enter a valid positive petrol price (₹/L).');
    petrolPriceInput.focus();
    return;
  }
  if (!startTimeVal) {
    showError('Please select a valid local departure date and time.');
    startTimeInput.focus();
    return;
  }

  const startTime = new Date(startTimeVal);
  if (isNaN(startTime.getTime())) {
    showError('Invalid departure date/time format.');
    startTimeInput.focus();
    return;
  }

  const cityStrings = [];
  for (let i = 0; i < cityInputs.length; i++) {
    const val = cityInputs[i].value.trim();
    if (!val) {
      showError(`Stop ${i + 1} city field cannot be blank.`);
      cityInputs[i].focus();
      return;
    }
    cityStrings.push(val);
  }

  if (cityStrings.length < MIN_CITIES) {
    showError('Please specify at least 2 cities for your route.');
    return;
  }

  showLoading(true);
  announceStatus('Resolving locations and calculating route...');

  try {
    // 1. Geocode all cities
    const resolvedCities = [];
    for (const cityQuery of cityStrings) {
      resolvedCities.push(await geocodeCity(cityQuery));
    }

    // 2. Try OSRM route
    const osrmResult = await tryFetchOSRMRoute(resolvedCities);

    if (osrmResult === null) {
      // OSRM failed — save state and ask user for total km
      pendingGeocodedCities = resolvedCities;
      pendingFormState = { mileage, petrolPrice, startTime };
      showLoading(false);
      hideResults();
      showManualDistancePrompt();
      announceStatus('Route could not be auto-calculated. Please enter the total distance manually.');
      return;
    }

    // 3. Continue with full calculations
    await completeCalculations(resolvedCities, osrmResult, mileage, petrolPrice, startTime, false);

  } catch (err) {
    showLoading(false);
    hideResults();
    showError(err.message || 'An unexpected error occurred.');
    announceStatus(`Error: ${err.message}`);
  }
}

async function handleManualDistanceSubmit() {
  const manualInput = document.getElementById('manualDistance');
  const manualKm = parseFloat(manualInput ? manualInput.value : '');

  if (isNaN(manualKm) || manualKm <= 0) {
    manualInput.focus();
    manualInput.style.borderColor = 'rgba(220, 38, 38, 0.6)';
    setTimeout(() => { manualInput.style.borderColor = ''; }, 2000);
    return;
  }

  if (!pendingGeocodedCities || !pendingFormState) {
    showError('Session expired. Please recalculate your route.');
    hideManualDistancePrompt();
    return;
  }

  const { mileage, petrolPrice, startTime } = pendingFormState;
  const resolvedCities = pendingGeocodedCities;

  // Build a synthetic single-leg route from the manual total distance
  const totalMeters = manualKm * 1000;
  const durationPerLeg = ((manualKm / resolvedCities.length - 1) / MANUAL_AVG_SPEED_KMH) * 3600;
  const legCount = resolvedCities.length - 1;
  const legDistanceMeters = totalMeters / legCount;
  const legDurationSeconds = (manualKm / legCount / MANUAL_AVG_SPEED_KMH) * 3600;

  const manualRouteData = {
    totalDistance: totalMeters,
    totalDuration: legDurationSeconds * legCount,
    legs: Array.from({ length: legCount }, () => ({
      distance: legDistanceMeters,
      duration: legDurationSeconds
    })),
    isManualFallback: true
  };

  hideManualDistancePrompt();
  showLoading(true);

  try {
    await completeCalculations(resolvedCities, manualRouteData, mileage, petrolPrice, startTime, true);
  } catch (err) {
    showLoading(false);
    hideResults();
    showError(err.message || 'An unexpected error occurred.');
  }
}

// ─────────────────────────────────────────────
// Core Calculation Pipeline
// ─────────────────────────────────────────────

async function completeCalculations(resolvedCities, rawRouteData, mileage, petrolPrice, startTime, isManual) {
  // Apply realistic time multiplier
  const totalDuration = Math.round(rawRouteData.totalDuration * REALISTIC_TIME_MULTIPLIER);
  const realisticLegs = rawRouteData.legs.map(leg => ({
    distance: leg.distance,
    duration: Math.round(leg.duration * REALISTIC_TIME_MULTIPLIER)
  }));

  const routeData = {
    totalDistance: rawRouteData.totalDistance,
    totalDuration,
    legs: realisticLegs,
    isManualFallback: isManual
  };

  // Calculate ETAs
  const stopETAs = [startTime];
  let currentMs = startTime.getTime();
  for (const leg of routeData.legs) {
    currentMs += leg.duration * 1000;
    stopETAs.push(new Date(currentMs));
  }

  // Fetch weather at each stop's ETA
  let weatherUnavailableCount = 0;
  const weatherResults = [];
  for (let i = 0; i < resolvedCities.length; i++) {
    const weather = await fetchWeatherForecast(resolvedCities[i].lat, resolvedCities[i].lon, stopETAs[i]);
    if (!weather) weatherUnavailableCount++;
    weatherResults.push(weather);
  }

  const totalDistanceKm = routeData.totalDistance / 1000;
  const fuelNeeded = totalDistanceKm / mileage;
  const estimatedCost = fuelNeeded * petrolPrice;

  renderResults({
    resolvedCities,
    routeData,
    stopETAs,
    weatherResults,
    weatherUnavailableCount,
    totalDistanceKm,
    totalDurationSeconds: routeData.totalDuration,
    fuelNeeded,
    estimatedCost
  });

  announceStatus(`Route calculated. Total distance: ${totalDistanceKm.toFixed(1)} km, estimated fuel cost: ₹${Math.round(estimatedCost).toLocaleString('en-IN')}.`);
}

// ─────────────────────────────────────────────
// API Calls
// ─────────────────────────────────────────────

async function geocodeCity(cityQuery) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityQuery)}&limit=1&appid=${OPENWEATHER_API_KEY}`;

  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`Network error while resolving "${cityQuery}".`);
  }

  if (res.status === 401) {
    isApiKeyInvalid = true;
    throw new Error('OpenWeather API Key is invalid or expired.');
  }
  if (!res.ok) {
    throw new Error(`Location lookup failed for "${cityQuery}" (HTTP ${res.status}).`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`"${cityQuery}" could not be found. Try "City, Country Code" format (e.g. "Pune, IN").`);
  }

  const place = data[0];
  return {
    query: cityQuery,
    name: place.name,
    tamilName: (place.local_names && place.local_names.ta) || null,
    country: place.country || '',
    state: place.state || '',
    lat: place.lat,
    lon: place.lon
  };
}

/**
 * Returns OSRM route data on success, or null if route is impossible / service fails.
 */
async function tryFetchOSRMRoute(cities) {
  const coordsString = cities.map(c => `${c.lon},${c.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false&steps=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    return {
      totalDistance: data.routes[0].distance,
      totalDuration: data.routes[0].duration,
      legs: data.routes[0].legs,
      isManualFallback: false
    };
  } catch (e) {
    return null;
  }
}

async function fetchWeatherForecast(lat, lon, targetEta) {
  if (isApiKeyInvalid) return null;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;

  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return null;
  }

  if (res.status === 401) { isApiKeyInvalid = true; return null; }
  if (!res.ok) return null;

  const data = await res.json();
  if (!data || !Array.isArray(data.list) || data.list.length === 0) return null;

  const targetTime = targetEta.getTime();
  const list = data.list;
  const minTime = list[0].dt * 1000;
  const maxTime = list[list.length - 1].dt * 1000;
  const bufferMs = 3 * 3600 * 1000;

  if (targetTime < minTime - bufferMs || targetTime > maxTime + bufferMs) return null;

  let closest = list[0];
  let minDiff = Math.abs(closest.dt * 1000 - targetTime);
  for (let i = 1; i < list.length; i++) {
    const diff = Math.abs(list[i].dt * 1000 - targetTime);
    if (diff < minDiff) { minDiff = diff; closest = list[i]; }
  }

  return {
    temp: Math.round(closest.main.temp),
    description: closest.weather[0].description,
    icon: closest.weather[0].icon,
    pop: Math.round((closest.pop || 0) * 100)
  };
}

// ─────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────

function renderResults(data) {
  showLoading(false);

  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results-container').style.display = 'block';

  const originName = data.resolvedCities[0].name;
  const destName = data.resolvedCities[data.resolvedCities.length - 1].name;
  document.getElementById('route-overview-subtitle').textContent =
    `${originName} to ${destName} · ${data.resolvedCities.length} Stops`;

  document.getElementById('metric-distance').textContent = data.totalDistanceKm.toFixed(1);
  document.getElementById('metric-duration').textContent = formatDuration(data.totalDurationSeconds);
  document.getElementById('metric-fuel').textContent = data.fuelNeeded.toFixed(1);
  document.getElementById('metric-cost').textContent = `₹ ${Math.round(data.estimatedCost).toLocaleString('en-IN')}`;

  const weatherNotice = document.getElementById('weather-notice');
  if (weatherNotice) {
    let notice = '';
    if (data.routeData.isManualFallback) {
      notice = 'Distance entered manually. ETAs and costs are estimated based on the total km you provided.';
    } else if (isApiKeyInvalid) {
      notice = 'Weather forecast unavailable — OpenWeather key is invalid or not yet activated.';
    } else if (data.weatherUnavailableCount > 0) {
      notice = `Weather unavailable for ${data.weatherUnavailableCount} stop(s) — ETA falls outside the 5-day forecast window.`;
    }
    if (notice) {
      weatherNotice.textContent = notice;
      weatherNotice.style.display = 'block';
    } else {
      weatherNotice.style.display = 'none';
    }
  }

  const timelineContainer = document.getElementById('stops-timeline');
  timelineContainer.innerHTML = '';

  data.resolvedCities.forEach((city, index) => {
    const eta = data.stopETAs[index];
    const weather = data.weatherResults[index];
    const isFirst = index === 0;
    const isLast = index === data.resolvedCities.length - 1;

    let stopBadgeText = `Stop ${index + 1}`;
    if (isFirst) stopBadgeText = 'Start';
    if (isLast) stopBadgeText = 'Destination';

    // Weather hero
    let weatherHeroHTML;
    if (weather) {
      const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
      weatherHeroHTML = `
        <div class="weather-hero-card" aria-label="Forecast at arrival">
          <div class="weather-hero-left">
            <img src="${iconUrl}" alt="${weather.description}" class="weather-hero-icon">
            <div class="weather-hero-info">
              <span class="weather-hero-temp">${weather.temp}°C</span>
              <span class="weather-hero-desc">${weather.description}</span>
            </div>
          </div>
          <div class="weather-hero-right">
            <span class="weather-pop-badge">🌧 ${weather.pop}% rain chance</span>
          </div>
        </div>`;
    } else {
      const reason = isApiKeyInvalid ? 'API key unactivated' : 'ETA > 5 days out';
      weatherHeroHTML = `
        <div class="weather-hero-card weather-hero-card--muted">
          <span class="weather-unavailable-text">🌤️ Forecast unavailable (${reason})</span>
        </div>`;
    }

    // City name with optional Tamil crossfade
    let cityNameHTML;
    if (city.tamilName && city.tamilName !== city.name) {
      cityNameHTML = `
        <span class="city-name-fader" title="${escapeHTML(city.name)} / ${escapeHTML(city.tamilName)}">
          <span class="name-en">${escapeHTML(city.name)}</span>
          <span class="name-ta">${escapeHTML(city.tamilName)}</span>
        </span>`;
    } else {
      cityNameHTML = `<span class="city-name-single">${escapeHTML(city.name)}</span>`;
    }

    const stopCardItem = document.createElement('div');
    stopCardItem.className = 'stop-card-item';
    stopCardItem.innerHTML = `
      <div class="stop-card">
        ${weatherHeroHTML}
        <div class="stop-card-body">
          <div class="stop-location-info">
            <span class="stop-badge">${stopBadgeText}</span>
            <span class="stop-city-name">${cityNameHTML}</span>
          </div>
          <div class="stop-eta-info">
            <span class="eta-label">${isFirst ? 'Departure Time' : 'Est. Arrival Time'}</span>
            <span class="eta-time">${formatDate(eta)}</span>
          </div>
        </div>
      </div>`;

    if (!isLast) {
      const leg = data.routeData.legs[index];
      const legKm = (leg.distance / 1000).toFixed(1);
      const legTimeStr = formatDuration(leg.duration);
      const legConnector = document.createElement('div');
      legConnector.className = 'leg-connector';
      legConnector.innerHTML = `
        <span class="leg-info-pill">
          <span class="leg-icon" aria-hidden="true">🚗</span> ${legKm} km · approx. ${legTimeStr}
        </span>`;
      stopCardItem.appendChild(legConnector);
    }

    timelineContainer.appendChild(stopCardItem);
  });
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

function formatDuration(seconds) {
  const totalMins = Math.round(seconds / 60);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`;
}

function formatDate(dateObj) {
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

function showError(msg) {
  const errBanner = document.getElementById('form-error');
  if (errBanner) { errBanner.textContent = msg; errBanner.style.display = 'block'; }
}

function clearErrors() {
  const errBanner = document.getElementById('form-error');
  if (errBanner) { errBanner.style.display = 'none'; errBanner.textContent = ''; }
}

function showLoading(loading) {
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const resultsContainer = document.getElementById('results-container');

  if (loading) {
    if (emptyState) emptyState.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (loadingState) loadingState.style.display = 'block';
  } else {
    if (loadingState) loadingState.style.display = 'none';
  }
}

function hideResults() {
  const emptyState = document.getElementById('empty-state');
  const resultsContainer = document.getElementById('results-container');
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (emptyState) emptyState.style.display = 'block';
}

function announceStatus(message) {
  const ariaStatus = document.getElementById('aria-status');
  if (ariaStatus) ariaStatus.textContent = message;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag));
}
