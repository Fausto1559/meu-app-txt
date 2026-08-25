import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "../services/firebaseConfig"; // Verifique se o caminho da sua configuracao do firebase é este

export function Perfil() {
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmAction = window.confirm(
      "ATENÇÃO: Esta ação é irreversível. Todos os seus dados financeiros serão excluídos permanentemente. Deseja continuar?"
    );

    if (!confirmAction) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
        alert("Sua conta e todos os seus dados foram excluídos com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      alert("Por segurança, faça login novamente antes de realizar a exclusão da conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Perfil e Configurações</h1>
      
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
        <h2 className="text-red-700 font-bold text-lg mb-2">Zona de Perigo (Conformidade LGPD)</h2>
        <p className="text-red-600 text-sm mb-4">
          Conforme a Lei Geral de Proteção de Dados, você tem o direito de apagar suas informações. Esta ação excluirá permanentemente seu usuário e todo o seu histórico financeiro do banco de dados.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Processando exclusão..." : "Excluir Minha Conta e Apagar Todos os Dados"}
        </button>
      </div>
    </div>
  );
}