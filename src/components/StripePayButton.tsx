import React from "react";

interface StripePayButtonProps {
  amount: number; // en centimes
  description: string;
  reservation: {
    nom: string;
    email: string;
    tel: string;
    message: string;
    date: string;
    horaire: string;
    service: string;
  };
}

const StripePayButton: React.FC<StripePayButtonProps> = ({
  amount,
  description,
  reservation,
}) => {
  const handlePay = async () => {
    try {
      const res = await fetch(
        "https://rababali.com/rabab/api/payment.php?action=create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, description, reservation }),
        }
      );
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(
          "Erreur lors de la création de la session de paiement: " +
            (data.message || "Erreur inconnue")
        );
      }
    } catch (error) {
      alert("Erreur de connexion lors du paiement. Veuillez réessayer.");
      console.error("Erreur paiement:", error);
    }
  };

  return (
    <button
      onClick={handlePay}
      className="btn-magical"
      style={{
        fontSize: 18,
        padding: "0.8em 2em",
        borderRadius: 24,
        marginTop: 8,
      }}
    >
      Payer en ligne
    </button>
  );
};

export default StripePayButton;
