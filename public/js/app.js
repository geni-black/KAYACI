// CONFIGURATION FIREBASE
firebase.initializeApp({
  apiKey: "AIzaSyDJSOgvUp-etceY1Uqo9j-y3GxfiXCuvEw",
  authDomain: "kayaci.firebaseapp.com",
  projectId: "kayaci",
});
const auth = firebase.auth();
const db = firebase.firestore();

// UTILITAIRES
function showToast(msg){
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(()=>t.style.display="none",3000);
}
function showSection(sectionId) {
  // Toutes les sections
  const sections = document.querySelectorAll('section');

  // On cache toutes les sections
  sections.forEach(sec => {
    sec.style.display = 'none';
  });

  // On affiche uniquement la section demandée
  const sectionToShow = document.getElementById(sectionId);
  if (sectionToShow) {
    sectionToShow.style.display = 'block';
  }
}

// INSCRIPTION
function register(){
  const emailVal = email.value;
  const passVal = password.value;
  const roleVal = role.value;
  if(passVal.length<6){ authMessage.innerText="Mot de passe min 6 caractères"; return; }

  auth.createUserWithEmailAndPassword(emailVal,passVal)
    .then(cred=>{
      db.collection("users").doc(cred.user.uid).set({
        role: roleVal, email: emailVal, createdAt:new Date()
      });
      authMessage.innerText="Compte créé avec succès";
    })
    .catch(e=>authMessage.innerText=e.message);
}

// CONNEXION
function login(){
  auth.signInWithEmailAndPassword(email.value,password.value)
    .then(()=> loadApp())
    .catch(()=> authMessage.innerText="Email ou mot de passe incorrect");
}

// LOAD APP
function loadApp(){
  auth.onAuthStateChanged(user=>{
    if(user){
      db.collection("users").doc(user.uid).get()
      .then(doc=>{
        const role = doc.data().role;
        showSection(role==="proprietaire"?"dashboardProprietaire":"dashboardLocataire");
        if(role==="proprietaire") loadProprietaire();
        else loadDashboardLocataire();
      });
    }
  });
}

// DASHBOARD PROPRIETAIRE
function loadProprietaire(){
  proprietaireForm.innerHTML=`
    <h3>Ajouter un bien</h3>
    <input id="titre" placeholder="Titre">
    <textarea id="description" placeholder="Description"></textarea>
    <input id="commune" placeholder="Commune">
    <input id="prix" placeholder="Prix">
    <input id="image" placeholder="URL image">
    <input id="video" placeholder="URL vidéo">
    <button onclick="addAnnonce()">Publier</button>
  `;
  loadMesAnnonces();
}

function addAnnonce(){
  db.collection("annonces").add({
    titre: titre.value,
    description: description.value,
    commune: commune.value,
    prix: parseFloat(prix.value),
    image: image.value,
    video: video.value,
    owner: auth.currentUser.uid,
    date: new Date()
  }).then(()=>{ showToast("Annonce publiée !"); loadMesAnnonces(); });
}

function loadMesAnnonces(){
  mesAnnonces.innerHTML="";
  db.collection("annonces").where("owner","==",auth.currentUser.uid).get()
  .then(snapshot=> snapshot.forEach(doc=>{
    const d = doc.data();
    mesAnnonces.innerHTML+=`
      <div class="card">
        <h4>${d.titre}</h4>
        <p>${d.prix} FCFA</p>
        <button onclick="deleteAnnonce('${doc.id}')">Supprimer</button>
      </div>
    `;
  }));
}

function deleteAnnonce(id){
  db.collection("annonces").doc(id).delete().then(()=>loadMesAnnonces());
}

// DASHBOARD LOCATAIRE
function loadDashboardLocataire(){
  mesLoyers.innerHTML="";
  db.collection("transactions").where("locataire","==",auth.currentUser.uid).orderBy("date","desc").get()
  .then(snapshot=>{
    snapshot.forEach(doc=>{
      const t = doc.data();
      db.collection("annonces").doc(t.bienId).get().then(aDoc=>{
        const a = aDoc.data();
        mesLoyers.innerHTML+=`
          <div class="card">
            <h4>${a.titre}</h4>
            <p>Commune: ${a.commune}</p>
            <p>Montant: ${t.montant} FCFA</p>
            <p>Status: ${t.status}</p>
            ${t.status==="en attente"?`<button onclick="payer('${t.bienId}',${t.montant})">Payer</button>`:""}
            <button onclick="signalerDepart('${t.bienId}')">Signaler départ</button>
          </div>
        `;
      });
    });
  });
}

function signalerDepart(bienId){ showToast("Préavis envoyé pour le bien : "+bienId); }

// ANNONCES PAGE
function loadHomeAnnonces(){
  homeList.innerHTML="";
  db.collection("annonces").orderBy("date","desc").limit(6).get()
  .then(snapshot=> snapshot.forEach(doc=>{
    const d = doc.data();
    homeList.innerHTML+=`
      <div class="card">
        <img src="${d.image}" width="100%">
        <h4>${d.titre}</h4>
        <p>${d.commune}</p>
        <p><strong>${d.prix} FCFA</strong></p>
      </div>
    `;
  }));
}

function searchAnnonces(){
  annoncesList.innerHTML="";
  db.collection("annonces").where("commune","==",searchCommune.value).get()
  .then(snapshot=> snapshot.forEach(doc=>{
    const d = doc.data();
    annoncesList.innerHTML+=`
      <div class="card">
        <img src="${d.image}" width="100%">
        <h4>${d.titre}</h4>
        <p>${d.description}</p>
        <p><strong>${d.prix} FCFA</strong></p>
        <a href="${d.video}" target="_blank">Voir vidéo</a>
        <button onclick="payer('${doc.id}',${d.prix})">Payer</button>
      </div>
    `;
  }));
}

// Paiement placeholder
function payer(bienId,montant){
  showToast("Paiement simulé : "+montant+" FCFA pour "+bienId);
  db.collection("transactions").add({
    locataire: auth.currentUser.uid,
    bienId: bienId,
    montant: montant,
    type: "loyer",
    date: new Date(),
    status: "payé"
  }).then(()=> loadDashboardLocataire());
}

// CONTACT
function envoyerMessage(){
  db.collection("contacts").add({
    nom: contactNom.value,
    email: contactEmail.value,
    message: contactMessage.value,
    date: new Date()
  }).then(()=> showToast("Message envoyé !"));
}

// CHARGEMENT INIT
window.onload = function(){ loadHomeAnnonces(); loadApp(); };
const mobileMenu = document.getElementById('mobile-menu');
const navList = document.querySelector('.nav-list');

mobileMenu.addEventListener('click', () => {
  navList.classList.toggle('active');
});
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.getElementById('mobile-menu');
  const navList = document.querySelector('.nav-list');

  if (mobileMenu && navList) {
    mobileMenu.addEventListener('click', () => {
      navList.classList.toggle('active');
    });
  }
});