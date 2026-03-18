const User = require('../models/User');
const generateToken = require('../util/generateToken');
const bcrypt = require('bcryptjs');
const paypal = require('@paypal/checkout-server-sdk');
const crypto = require("crypto");

// Configuration PayPal
const environment = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

/* ============================
   INSCRIPTION
============================ */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'Utilisateur déjà inscrit' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id)
  });
};

/* ============================
   MOT DE PASSE OUBLIÉ
============================ */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });

      // On ne révèle pas si l'email existe ou non
      if (!user) {
          return res.status(200).json({
              message: "Si cet email existe, un lien de réinitialisation a été envoyé."
          });
      }

      // Génération d’un token sécurisé
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Stockage du token + expiration (15 minutes)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

      await user.save();

      // Pour l'instant, on renvoie le token (utile pour tests)
      return res.status(200).json({
          message: "Lien de réinitialisation généré.",
          resetToken
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur." });
  }
};

/* ============================
   RÉINITIALISATION DU MOT DE PASSE
============================ */
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
      const user = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ message: "Lien invalide ou expiré." });
      }

      // Hash du nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Suppression du token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur." });
  }
};

/* ============================
   PAYPAL : CRÉATION D’ORDRE
============================ */
const createPayPalOrder = async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      { amount: { currency_code: 'EUR', value: '10.00' } }
    ]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   PAYPAL : CAPTURE + MISE À JOUR USER
============================ */
const capturePayPalOrder = async (req, res) => {
  const { orderID } = req.body;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const user = await User.findById(req.user._id);
      user.isPaid = true;
      await user.save();

      return res.json({ message: 'Paiement réussi', user });
    }

    res.status(400).json({ message: 'Paiement non complété' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  registerUser, 
  createPayPalOrder, 
  capturePayPalOrder,
  forgotPassword,
  resetPassword
};


