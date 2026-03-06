const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Trigger après ajout d'une transaction
exports.applyCommission = functions.firestore
  .document('transactions/{docId}')
  .onCreate((snap, context) => {
    const data = snap.data();
    const commission = data.montant * 0.03; // 3%
    return admin.firestore().collection('transactions').doc(context.params.docId).update({
      commission: commission,
      net: data.montant - commission
    });
  });
  const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Trigger après ajout d'une transaction (paiement de loyer)
exports.applyCommission = functions.firestore
  .document("transactions/{docId}")
  .onCreate((snap, context) => {

    const data = snap.data();

    // Vérifie que le champ montant existe
    if (!data.montant) {
      console.log("Transaction sans montant, annulée.");
      return null;
    }

    const montant = parseFloat(data.montant);
    const commission = montant * 0.03;  // 3%
    const net = montant - commission;

    console.log(`Transaction reçue: ${montant} XOF`);
    console.log(`Commission: ${commission} XOF`);
    console.log(`Net propriétaire: ${net} XOF`);

    // Mise à jour de la transaction avec commission et net
    return admin.firestore()
      .collection("transactions")
      .doc(context.params.docId)
      .update({
        commission: commission,
        net: net,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  });