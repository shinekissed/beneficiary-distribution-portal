
/**
 * Frontend API Service
 *
 * Uses fictional mock data during development.
 * Switches to backend requests when the API is ready.
 */

const API = {
  async request(endpoint, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      API_CONFIG.TIMEOUT
    );

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${endpoint}`,
        {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status}`
        );
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  },

  async getSchedules(barangay = "") {
    if (API_CONFIG.USE_MOCK_DATA) {
      const schedules = MOCK_DATA.schedules;

      if (!barangay.trim()) {
        return schedules;
      }

      return schedules.filter(schedule =>
        schedule.barangay
          .toLowerCase()
          .includes(barangay.trim().toLowerCase())
      );
    }

    const query = barangay
      ? `?barangay=${encodeURIComponent(barangay)}`
      : "";

    return this.request(`/schedules${query}`);
  },

  async lookupBeneficiary(name, referenceCode) {
    if (API_CONFIG.USE_MOCK_DATA) {
      const beneficiary = MOCK_DATA.beneficiaries.find(
        record =>
          record.name.toLowerCase() ===
            name.trim().toLowerCase() &&
          record.referenceCode.toLowerCase() ===
            referenceCode.trim().toLowerCase()
      );

      return beneficiary || null;
    }

    return this.request("/beneficiaries/lookup", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        referenceCode: referenceCode.trim()
      })
    });
  },

  async getAnnouncements() {
    if (API_CONFIG.USE_MOCK_DATA) {
      return MOCK_DATA.announcements;
    }

    return this.request("/announcements");
  }
};
