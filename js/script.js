const API_KEY = "d2b24cea797fa872ee074acbb6f7a166"; // clé obtenue depuis https://www.themoviedb.org/settings/api
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

const moviesGrid = document.getElementById("movies-grid");
const statusMessage = document.getElementById("status-message");
const themeToggle = document.getElementById("theme-toggle");
const scrollTopBtn = document.getElementById("scroll-top");

// récupère les films populaires du moment depuis TMDB
async function getPopularMovies() {
    afficherLoader();
    try {
        const reponse = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=fr-FR&page=1`);
        if (!reponse.ok) throw new Error("Erreur reseau");
        const donnees = await reponse.json();
        viderStatus();
        afficherFilms(donnees.results);
    } catch (erreur) {
        afficherErreur();
    }
}

// affiche le loader pendant le chargement
function afficherLoader() {
    statusMessage.innerHTML = `<div class="loader"></div>`;
    moviesGrid.innerHTML = "";
}

// vide la zone de statut une fois le chargement terminé
function viderStatus() {
    statusMessage.innerHTML = "";
}

// affiche un message d'erreur clair en cas d'echec de la requête
function afficherErreur() {
    statusMessage.innerHTML = `
        <p>
            <strong>OUUPS ! :(</strong><br>
            <em>Impossible de charger les films pour le moment, veuillez verifier votre connexion Internet.</em>
        </p>
    `;
}

// génère et affiche les cartes de films dans la grille
function afficherFilms(films) {
    moviesGrid.innerHTML = films.map(creerCarteFilm).join("");
}

// construit le HTML d'une carte de film individuelle
function creerCarteFilm(film) {
    const affiche = film.poster_path ? `${IMG_URL}${film.poster_path}` : "https://via.placeholder.com/220x330?text=Pas+d%27affiche";
    const dateSortie = film.release_date ? new Date(film.release_date).toLocaleDateString("fr-FR") : "Date inconnue";
    const note = film.vote_average.toFixed(1);
    const classeNote = obtenirClasseNote(film.vote_average);
    const estFavori = estDansFavoris(film.id);
    return `
        <article class="movie-card" data-id="${film.id}">
            <button class="favorite-btn ${estFavori ? "active" : ""}" data-id="${film.id}" aria-label="Ajouter aux favoris">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
            </button>
            <img class="movie-poster" src="${affiche}" alt="Affiche de ${film.title}" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${film.title}</h3>
                <div class="movie-meta">
                    <span>${dateSortie}</span>
                    <span class="movie-rating ${classeNote}">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15 9 22 9 16.5 13.5 18.5 21 12 17 5.5 21 7.5 13.5 2 9 9 9"/></svg>
                        ${note}
                    </span>
                </div>
            </div>
        </article>
    `;
}

// détermine la classe de couleur selon la valeur de la note
function obtenirClasseNote(note) {
    if (note > 7) return "rating-high";
    if (note >= 5) return "rating-medium";
    return "rating-low";
}

// bascule entre thème clair et sombre, sauvegarde le choix
function basculerTheme() {
    const themeActuel = document.documentElement.getAttribute("data-theme");
    const nouveauTheme = themeActuel === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nouveauTheme);
    localStorage.setItem("theme", nouveauTheme);
}

// applique le thème sauvegardé au chargement de la page
function initTheme() {
    const themeSauvegarde = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", themeSauvegarde);
}

// affiche ou masque le bouton remonter en haut selon le scroll
function gererScrollTop() {
    if (window.scrollY > 400) {
        scrollTopBtn.classList.add("visible");
    } else {
        scrollTopBtn.classList.remove("visible");
    }
}

themeToggle.addEventListener("click", basculerTheme);
window.addEventListener("scroll", gererScrollTop);
scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// onglets tendances / favoris
const tabTrending = document.getElementById("tab-trending");
const tabFavorites = document.getElementById("tab-favorites");
const panelTrending = document.getElementById("panel-trending");
const panelFavorites = document.getElementById("panel-favorites");
const favoritesCount = document.getElementById("favorites-count");

// bascule l'affichage entre l'onglet tendances et l'onglet favoris
function activerOnglet(nom) {
    const estTendances = nom === "trending";
    tabTrending.classList.toggle("active", estTendances);
    tabFavorites.classList.toggle("active", !estTendances);
    panelTrending.classList.toggle("visible-panel", estTendances);
    panelFavorites.classList.toggle("visible-panel", !estTendances);
}

tabTrending.addEventListener("click", () => activerOnglet("trending"));
tabFavorites.addEventListener("click", () => activerOnglet("favorites"));

// recherche
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
let timerDebounce;

// recherche des films correspondant au terme saisi via l'endpoint search de TMDB
async function rechercherFilms(terme) {
    afficherLoader();
    try {
        const reponse = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(terme)}`);
        if (!reponse.ok) throw new Error("Erreur réseau");
        const donnees = await reponse.json();
        viderStatus();
        if (donnees.results.length === 0) {
            statusMessage.innerHTML = `<p>Aucun résultat pour <strong>"${terme}"</strong></p>`;
        }
        afficherFilms(donnees.results);
    } catch (erreur) {
        afficherErreur();
    }
}

// attend que l'utilisateur arrête de taper avant de lancer la requête
function gererRecherche() {
    clearTimeout(timerDebounce);
    const terme = searchInput.value.trim();
    clearSearchBtn.classList.toggle("visible", terme.length > 0);
    if (terme.length > 0) activerOnglet("trending");

    timerDebounce = setTimeout(() => {
        if (terme.length > 0) {
            rechercherFilms(terme);
        } else {
            getPopularMovies();
        }
    }, 400);
}

searchInput.addEventListener("input", gererRecherche);
clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.remove("visible");
    getPopularMovies();
    searchInput.focus();
});

// favoris et modale de détails
const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");
const modalClose = document.getElementById("modal-close");
const favoritesGrid = document.getElementById("favorites-grid");
const noFavoritesMsg = document.getElementById("no-favorites");

// récupère la liste des favoris depuis le localStorage
function obtenirFavoris() {
    return JSON.parse(localStorage.getItem("favoris")) || [];
}

// vérifie si un film est déjà dans les favoris
function estDansFavoris(id) {
    return obtenirFavoris().some(film => film.id === id);
}

// ajoute ou retire un film des favoris selon son état actuel
function basculerFavori(film) {
    let favoris = obtenirFavoris();
    const dejaFavori = estDansFavoris(film.id);
    if (dejaFavori) {
        favoris = favoris.filter(f => f.id !== film.id);
        afficherToast("Retiré des favoris", "removed");
    } else {
        favoris.push(film);
        afficherToast("Ajouté aux favoris", "added");
    }
    localStorage.setItem("favoris", JSON.stringify(favoris));
    afficherFavoris();
    mettreAJourBoutonsFavoris(film.id, !dejaFavori);
}

// met à jour visuellement tous les boutons coeur de ce film, sur toute la page
function mettreAJourBoutonsFavoris(id, estFavori) {
    document.querySelectorAll(`.favorite-btn[data-id="${id}"]`).forEach(btn => {
        btn.classList.toggle("active", estFavori);
    });
}

// affiche la section des films favoris sauvegardés
function afficherFavoris() {
    const favoris = obtenirFavoris();
    favoritesGrid.innerHTML = favoris.map(creerCarteFilm).join("");
    noFavoritesMsg.classList.toggle("visible", favoris.length === 0);
    favoritesCount.textContent = favoris.length;
}

// affiche un toast de confirmation temporaire en bas de l'écran
function afficherToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// convertit une durée en minutes en format lisible du type "2h30"
function formaterDuree(minutes) {
    if (!minutes) return "Durée inconnue";
    const heures = Math.floor(minutes / 60);
    const min = minutes % 60;
    return `${heures}h${min.toString().padStart(2, "0")}`;
}

// récupère les détails complets d'un film et ouvre la modale
async function afficherDetailsFilm(id) {
    try {
        const reponse = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=fr-FR`);
        if (!reponse.ok) throw new Error("Erreur reseau");
        const film = await reponse.json();
        ouvrirModale(film);
    } catch (erreur) {
        afficherToast("Impossible de charger les détails", "error");
    }
}

// construit et affiche le contenu détaillé de la modale
function ouvrirModale(film) {
    const affiche = film.poster_path ? `${IMG_URL}${film.poster_path}` : "https://via.placeholder.com/500x750?text=Pas+d%27affiche";
    const genres = film.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join("");
    const dateSortie = film.release_date ? new Date(film.release_date).toLocaleDateString("fr-FR") : "Date inconnue";
    modalContent.innerHTML = `
        <div class="modal-body">
            <div class="modal-poster-wrap">
                <img class="modal-poster" src="${affiche}" alt="Affiche de ${film.title}">
            </div>
            <div class="modal-info">
                <h3>${film.title}</h3>
                ${film.tagline ? `<p class="modal-tagline">${film.tagline}</p>` : ""}
                <div class="modal-genres">${genres}</div>
                <h4 class="modal-subtitle">Synopsis</h4>
                <p class="modal-overview">${film.overview || "Aucun synopsis disponible pour ce film."}</p>
                <div class="modal-details">
                    <div class="detail-item">
                        <span class="detail-label">Date de sortie</span>
                        <span class="detail-value">${dateSortie}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Durée</span>
                        <span class="detail-value">${formaterDuree(film.runtime)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Note moyenne</span>
                        <span class="detail-value">★ ${film.vote_average.toFixed(1)}/10 (${film.vote_count} votes)</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    modalOverlay.classList.add("open");
}

// ferme la modale de details
function fermerModale() {
    modalOverlay.classList.remove("open");
}

// gère les clics sur une carte (ouvrir modale) ou sur le bouton coeur (favoris)
function gererClicGrille(event) {
    const boutonFavori = event.target.closest(".favorite-btn");
    if (boutonFavori) {
        const id = Number(boutonFavori.dataset.id);
        const carte = boutonFavori.closest(".movie-card");
        const film = {
            id: id,
            title: carte.querySelector(".movie-title").textContent,
            poster_path: carte.querySelector(".movie-poster").src.replace(IMG_URL, ""),
            release_date: "",
            vote_average: 0
        };
        recupererFilmPourFavori(id, film);
        return;
    }

    const carteCliquee = event.target.closest(".movie-card");
    if (carteCliquee) {
        afficherDetailsFilm(carteCliquee.dataset.id);
    }
}

// récupère les vraies données du film avant de le sauvegarder en favori
async function recupererFilmPourFavori(id, filmPartiel) {
    if (estDansFavoris(id)) {
        basculerFavori(filmPartiel);
        return;
    }
    try {
        const reponse = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=fr-FR`);
        const filmComplet = await reponse.json();
        basculerFavori(filmComplet);
    } catch (erreur) {
        afficherToast("Erreur lors de l'ajout aux favoris", "error");
    }
}

moviesGrid.addEventListener("click", gererClicGrille);
favoritesGrid.addEventListener("click", gererClicGrille);
modalClose.addEventListener("click", fermerModale);
modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) fermerModale();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") fermerModale();
});

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    getPopularMovies();
    afficherFavoris();
});