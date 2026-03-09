(function () {
  var GOOGLE_MAPS_DEFAULT_LINK = "https://www.google.com/maps/place/3J+Urgent+Care/@29.5590641,-95.3021931,17z/data=!3m1!4b1!4m6!3m5!1s0x86409133d76cfe7b:0x636037750ed7b4bb!8m2!3d29.5590641!4d-95.3021931!16s%2Fg%2F11q57z_lnp?entry=ttu";
  var API_KEY = "PASTE_GOOGLE_MAPS_API_KEY_HERE";
  var CACHE_KEY = "threej_google_reviews_cache_v1";
  var CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  var ratingEl = document.getElementById("google-rating");
  var ratingInlineEl = document.getElementById("google-rating-inline");
  var countEl = document.getElementById("google-review-count");
  var linkEl = document.getElementById("google-reviews-link");

  if (!ratingEl || !countEl || !linkEl) {
    return;
  }

  linkEl.href = GOOGLE_MAPS_DEFAULT_LINK;

  function applyData(data) {
    if (!data) return;
    if (typeof data.rating === "number") {
      ratingEl.textContent = data.rating.toFixed(1);
      if (ratingInlineEl) {
        ratingInlineEl.textContent = data.rating.toFixed(1);
      }
    }
    if (typeof data.userRatingCount === "number") {
      countEl.textContent = data.userRatingCount.toLocaleString();
    }
    if (data.googleMapsUri) {
      linkEl.href = data.googleMapsUri;
    }
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.savedAt || !parsed.data) return null;
      if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function saveCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data: data }));
    } catch (e) {
      // Ignore storage errors
    }
  }

  var cached = readCache();
  if (cached) {
    applyData(cached);
  }

  if (!API_KEY || API_KEY.indexOf("PASTE_GOOGLE_MAPS_API_KEY_HERE") === 0) {
    return;
  }

  fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.googleMapsUri"
    },
    body: JSON.stringify({
      textQuery: "3J Urgent Care Pearland TX",
      maxResultCount: 1
    })
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Google Places API error: " + response.status);
      }
      return response.json();
    })
    .then(function (json) {
      if (!json || !json.places || !json.places.length) return;
      var place = json.places[0];
      var data = {
        rating: place.rating,
        userRatingCount: place.userRatingCount,
        googleMapsUri: place.googleMapsUri || GOOGLE_MAPS_DEFAULT_LINK
      };
      applyData(data);
      saveCache(data);
    })
    .catch(function () {
      // Keep default values if API fails.
    });
})();
