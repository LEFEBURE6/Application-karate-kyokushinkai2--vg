const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
);

async function sendEmail(to, subject, html) {
    try {
        await mailjet
            .post("send", { version: "v3.1" })
            .request({
                Messages: [
                    {
                        From: {
                            Email: process.env.MAILJET_SENDER,
                            Name: "Karate Kyokushinkai "
                        },
                        To: [
                            {
                                Email: to
                            }
                        ],
                        Subject: subject,
                        HTMLPart: html
                    }
                ]
            });

        console.log("Email envoyé à " + to);

    } catch (error) {
        console.error("Erreur Mailjet :", error);
    }
}

module.exports = sendEmail;
