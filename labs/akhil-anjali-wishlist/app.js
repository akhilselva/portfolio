const { createApp } = Vue;
const { createVuetify } = Vuetify;

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  }
});

const API_BASE_URL = "https://wishlist-api.akhilselva.com";

const DUMMY_ITEMS = [
  {
    id: 1,
    name: "Dinner Set",
    url: "https://example.com/dinner-set",
    description: "A simple elegant dinner set for the new home.",
    addedBy: "Anjali",
  },
  {
    id: 2,
    name: "Air Fryer",
    url: "https://example.com/air-fryer",
    description: "For lazy crispy food days.",
    addedBy: "Akhil",
  },
  {
    id: 3,
    name: "Bedsheet Set",
    url: "https://example.com/bedsheet",
    description: "Soft everyday bedsheets.",
    addedBy: "Anjali",
  },
  {
    id: 4,
    name: "Coffee Maker",
    url: "https://example.com/coffee-maker",
    description: "Because mornings need help.",
    addedBy: "Akhil",
  },
];

const DUMMY_PUBLIC_COMMITMENTS = [
  { itemId: 2, name: "Rahul" },
  { itemId: 4, name: "Nikhil" },
  { itemId: 4, name: "Priya" },
];

createApp({
  data() {
    return {
      currentRoute: window.location.hash || "#/wishlist",

      wishlistItems: [],
      publicCommitments: [],

      selectedItemIds: [],
      visitorName: "",
      visitorPhone: "",

      successMessage: "",
      errorMessage: "",
      infoMessage: "",
      isLoading: false,
      isUsingFallbackData: false,
      isLookupLoading: false,
      isSaveLoading: false,
      isClearLoading: false,
      isDarkMode: false,
      //admin data
      adminUser: "akhil",
      adminPassword: "",
      adminToken: localStorage.getItem("wishlistAdminToken") || "",
      adminLoggedInUser: localStorage.getItem("wishlistAdminUser") || "",
      adminItemName: "",
      adminItemUrl: "",
      adminItemDescription: "",
      isAdminLoginLoading: false,
      isAdminAddLoading: false,
    };
  },

  computed: {
    isAdminRoute() {
      return this.currentRoute === "#/admin";
    },

    selectedCount() {
      return this.selectedItemIds.length;
    },

    normalizedPhone() {
      return String(this.visitorPhone || "").replace(/\D/g, "");
    },

    isValidPhone() {
      return /^\d{10}$/.test(this.normalizedPhone);
    },

    canLookupCommitment() {
      return this.isValidPhone;
    },

    canSubmitCommitment() {
      return (
        this.visitorName?.trim().length >= 2 &&
        this.isValidPhone &&
        this.selectedItemIds.length > 0 &&
        this.selectedItemIds.length <= 3
      );
    },
    currentTheme() {
      return this.isDarkMode ? "dark" : "light";
    },
    //admin computed
    isAdminLoggedIn() {
      return Boolean(this.adminToken);
    },

    canAdminLogin() {
      return this.adminUser && this.adminPassword.length > 0;
    },

    canAddAdminItem() {
      return this.adminItemName.trim().length >= 2;
    },
  },

  async mounted() {
    window.addEventListener("hashchange", this.syncRoute);

    if (!window.location.hash) {
      window.location.hash = "#/wishlist";
    }

    await this.loadWishlistData();
  },

  beforeUnmount() {
    window.removeEventListener("hashchange", this.syncRoute);
  },

  methods: {
    async loadWishlistData() {
      this.isLoading = true;
      this.isUsingFallbackData = false;

      try {
        const [itemsResponse, commitmentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/items`),
          fetch(`${API_BASE_URL}/api/commitments`),
        ]);

        if (!itemsResponse.ok || !commitmentsResponse.ok) {
          throw new Error("Failed to load wishlist data.");
        }

        const itemsData = await itemsResponse.json();
        const commitmentsData = await commitmentsResponse.json();

        this.wishlistItems = itemsData.items || [];
        this.publicCommitments = commitmentsData.commitments || [];
      } catch (error) {
        this.wishlistItems = DUMMY_ITEMS;
        this.publicCommitments = DUMMY_PUBLIC_COMMITMENTS;
        this.isUsingFallbackData = true;
        this.infoMessage = "Using fallback data because the API could not be reached.";
      } finally {
        this.isLoading = false;
      }
    },

    syncRoute() {
      this.currentRoute = window.location.hash || "#/wishlist";
      this.clearMessages();
    },

    goTo(route) {
      window.location.hash = route;
    },

    normalizePhone(phone) {
      return String(phone || "").replace(/\D/g, "");
    },

    clearMessages() {
      this.successMessage = "";
      this.errorMessage = "";
      this.infoMessage = "";
    },

    isSelected(itemId) {
      return this.selectedItemIds.includes(itemId);
    },

    toggleItem(itemId) {
      this.clearMessages();

      if (this.isSelected(itemId)) {
        this.selectedItemIds = this.selectedItemIds.filter((id) => id !== itemId);
        return;
      }

      if (this.selectedItemIds.length >= 3) {
        this.errorMessage = "You can select up to 3 items only.";
        return;
      }

      this.selectedItemIds.push(itemId);
    },

    getCommittedNames(itemId) {
      return this.publicCommitments
        .filter((commitment) => commitment.itemId === itemId)
        .map((commitment) => commitment.name);
    },

    async lookupCommitment() {
      this.clearMessages();

      if (!this.isValidPhone) {
        this.errorMessage = "Enter a valid 10-digit phone number.";
        return;
      }

      this.isLookupLoading = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/commitments/lookup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: this.normalizedPhone,
          }),
        });

        const data = await res.json();

        if (!data.ok) throw new Error(data.message);

        if (!data.found) {
          this.selectedItemIds = [];
          this.infoMessage = "No existing selection found.";
          return;
        }

        this.visitorName = data.name;
        this.selectedItemIds = data.itemIds;

        this.successMessage = "Your selection has been loaded.";
      } catch (err) {
        this.errorMessage = "Failed to lookup your selection.";
      } finally {
        this.isLookupLoading = false;
      }
    },

    async submitCommitment() {
      this.clearMessages();

      if (!this.canSubmitCommitment) {
        this.errorMessage = "Please complete all fields correctly.";
        return;
      }

      this.isSaveLoading = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/commitments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: this.visitorName.trim(),
            phone: this.normalizedPhone,
            itemIds: this.selectedItemIds,
          }),
        });

        const data = await res.json();

        if (!data.ok) throw new Error(data.message);

        this.successMessage = "Your gift selection has been saved.";
        await this.loadWishlistData();
      } catch (err) {
        this.errorMessage = "Failed to save your selection.";
      } finally {
        this.isSaveLoading = false;
      }
    },

    async clearCommitment() {
      this.clearMessages();

      if (!this.isValidPhone) {
        this.errorMessage = "Enter your phone number first.";
        return;
      }

      this.isClearLoading = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/commitments`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: this.normalizedPhone,
          }),
        });

        const data = await res.json();

        if (!data.ok) throw new Error(data.message);

        this.selectedItemIds = [];
        this.visitorName = "";
        this.visitorPhone = "";

        this.successMessage = "Your selection has been cleared.";
        await this.loadWishlistData();
      } catch (err) {
        this.errorMessage = "Failed to clear your selection.";
      } finally {
        this.isClearLoading = false;
      }
    },

    toggleTheme() {
      this.isDarkMode = !this.isDarkMode;
    },

    //admin methods

    async adminLogin() {
      this.clearMessages();

      if (!this.canAdminLogin) {
        this.errorMessage = "Enter admin username and password.";
        return;
      }

      this.isAdminLoginLoading = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: this.adminUser,
            password: this.adminPassword,
          }),
        });

        const data = await res.json();

        if (!data.ok) throw new Error(data.message);

        this.adminToken = data.token;
        this.adminLoggedInUser = data.user;
        this.adminPassword = "";

        localStorage.setItem("wishlistAdminToken", data.token);
        localStorage.setItem("wishlistAdminUser", data.user);

        this.successMessage = "Admin login successful.";
      } catch (err) {
        this.errorMessage = "Admin login failed.";
      } finally {
        this.isAdminLoginLoading = false;
      }
    },

    adminLogout() {
      this.adminToken = "";
      this.adminLoggedInUser = "";
      this.adminPassword = "";

      localStorage.removeItem("wishlistAdminToken");
      localStorage.removeItem("wishlistAdminUser");

      this.successMessage = "Logged out.";
    },

    async addAdminItem() {
      this.clearMessages();

      if (!this.canAddAdminItem) {
        this.errorMessage = "Enter an item name.";
        return;
      }

      this.isAdminAddLoading = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.adminToken}`,
          },
          body: JSON.stringify({
            name: this.adminItemName,
            url: this.adminItemUrl,
            description: this.adminItemDescription,
          }),
        });

        const data = await res.json();

        if (!data.ok) throw new Error(data.message);

        this.adminItemName = "";
        this.adminItemUrl = "";
        this.adminItemDescription = "";

        this.successMessage = "Wishlist item added.";
        await this.loadWishlistData();
      } catch (err) {
        this.errorMessage = "Failed to add wishlist item.";
      } finally {
        this.isAdminAddLoading = false;
      }
    },
  },
})
  .use(vuetify)
  .mount("#app");