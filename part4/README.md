# Partie 4 - Client Web Simple

Cette partie du projet se concentre sur le **développement front-end** de l'application en utilisant **HTML5, CSS3 et JavaScript ES6**. L'objectif est de créer une interface interactive et conviviale qui communique avec les services back-end développés dans les phases précédentes.

---

## Objectifs

- Développer une interface utilisateur facile à utiliser selon les spécifications fournies.
- Implémenter les fonctionnalités côté client pour interagir avec l'API back-end.
- Assurer une gestion des données sécurisée et efficace en JavaScript.
- Appliquer les bonnes pratiques modernes du développement web pour créer une application dynamique.

---

## Objectifs pédagogiques

- Comprendre et appliquer **HTML5, CSS3 et JavaScript ES6** dans un projet réel.
- Apprendre à interagir avec les services back-end via **AJAX / Fetch API**.
- Implémenter des mécanismes d'authentification et gérer les **sessions utilisateur**.
- Utiliser le scripting côté client pour améliorer l'expérience utilisateur sans rechargement de page.

---

## Répartition des tâches

### 1. Design

- Compléter les fichiers HTML et CSS fournis pour correspondre aux spécifications de design.
- Créer les pages suivantes :
  - **Connexion (Login)**
  - **Liste des lieux**
  - **Détails d’un lieu**
  - **Ajouter un avis**

### 2. Connexion (Login)

- Implémenter la fonctionnalité de connexion via l'API back-end.
- Stocker le **token JWT** retourné par l'API dans un cookie pour la gestion de session.

### 3. Liste des lieux

- Afficher la liste de tous les lieux sur la page principale.
- Récupérer les données depuis l’API et mettre en place un filtrage côté client selon le pays.
- Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié.

### 4. Détails d’un lieu

- Afficher la vue détaillée d’un lieu.
- Récupérer les détails du lieu via l’API en utilisant l’ID du lieu.
- Permettre l’accès au formulaire **Ajouter un avis** uniquement si l’utilisateur est authentifié.

### 5. Ajouter un avis

- Implémenter le formulaire pour ajouter un avis sur un lieu.
- Restreindre l'accès aux utilisateurs authentifiés et rediriger les autres vers la page d’accueil.


---

## Technologies utilisées

- **HTML5** – pour la structure des pages web.
- **CSS3** – pour le style et la mise en page.
- **JavaScript ES6** – pour l’interactivité côté client et la communication avec l’API.
- **Fetch API / AJAX** – pour récupérer les données depuis le back-end.
- **Cookies / JWT** – pour la gestion des sessions et l’authentification.
