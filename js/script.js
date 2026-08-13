/* jshint esversion: 8 */

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
    statusMessage.innerHTML = `<p><strong>OUUPS ! :(</strong> <br> <em>Impossible de charger les films pour le moment, veuillez vérifier votre connexion Internet.</em></p>`;
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
    return `
        <article class="movie-card">
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

const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
let timerDebounce;

// recherche des films correspondant au terme saisi via l'endpoint search de TMDB
async function rechercherFilms(terme) {
    afficherLoader();
    try {
        const reponse = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(terme)}`);
        if (!reponse.ok) throw new Error("Erreur reseau");
        const donnees = await reponse.json();
        viderStatus();
        if (donnees.results.length === 0) {
            statusMessage.innerHTML = `<p>Aucun resultat pour <strong>"${terme}"</strong></p>`;
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
});

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    getPopularMovies();
});