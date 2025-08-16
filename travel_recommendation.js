// Cache API data to avoid fetching on every search
let cachedData = null;
async function fetchData() {
  if (cachedData) return cachedData;
  const response = await fetch("travel_recommendation_api.json");
  if (!response.ok) throw new Error("Failed to load recommendations");
  const json = await response.json();
  cachedData = json;
  return json;
}

async function search() {
  const inputEl = document.getElementById("searchInput");
  const query = (inputEl.value || "").trim().toLowerCase();

  // Guard against empty query which previously returned everything
  if (!query) {
    displayResults(
      [],
      "Please enter a keyword (e.g., beaches, temples, Japan, Tokyo)."
    );
    return;
  }

  let data;
  try {
    data = await fetchData();
  } catch (err) {
    displayResults(
      [],
      "Could not load recommendations. Please try again later."
    );
    return;
  }

  // Support plural/synonyms
  const keywordGroups = {
    beaches: ["beach", "beaches", "seaside", "coast", "shore"],
    temples: ["temple", "temples", "shrine", "pagoda"],
  };

  let results = [];
  const matchesAny = (words) => words.some((w) => query.includes(w));

  if (matchesAny(keywordGroups.beaches)) {
    results = data.beaches.slice();
  } else if (matchesAny(keywordGroups.temples)) {
    results = data.temples.slice();
  } else {
    // Countries and cities partial match
    data.countries.forEach((country) => {
      const countryMatches = country.name.toLowerCase().includes(query);
      if (countryMatches) {
        results = results.concat(country.cities);
      }
      country.cities.forEach((city) => {
        if (city.name.toLowerCase().includes(query)) {
          results.push(city);
        }
      });
    });
  }

  // Deduplicate by name to avoid duplicates when both country and city match
  const uniqueByName = new Map();
  results.forEach((item) => {
    if (item && item.name && !uniqueByName.has(item.name)) {
      uniqueByName.set(item.name, item);
    }
  });

  displayResults(Array.from(uniqueByName.values()));
}

function displayResults(results, messageOverride) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (messageOverride) {
    resultsDiv.innerHTML = `<p>${messageOverride}</p>`;
    return;
  }

  if (!results || results.length === 0) {
    resultsDiv.innerHTML =
      "<p>No recommendations found. Try another keyword.</p>";
    return;
  }

  results.forEach((place) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${place.imageUrl}" alt="${place.name}">
      <h3>${place.name}</h3>
      <p>${place.description}</p>
    `;
    resultsDiv.appendChild(card);
  });
}

function clearResults() {
  const input = document.getElementById("searchInput");
  input.value = "";
  document.getElementById("results").innerHTML = "";
  input.focus();
}

// Allow pressing Enter in the input to trigger search
(() => {
  const input = document.getElementById("searchInput");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        search();
      }
    });
  }
})();
