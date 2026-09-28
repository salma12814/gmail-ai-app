// AnalysisPanel.jsx - Version améliorée avec envoi de réponses

import React, { useState } from 'react';
import { gmailAPI } from '../api/client';
import SentimentBadge from './SentimentBadge';
import PriorityBadge from './PriorityBadge';

export default function AnalysisPanel({ email, analysis, userId }) {
  const [loading, setLoading] = useState(false);
  const [generatedReply, setGeneratedReply] = useState(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('view'); // 'view' | 'generate' | 'approve' | 'sent'

  // ✅ Mode 1: Générer la réponse uniquement
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await gmailAPI.analyzeEmail(email.id);
      console.log('Analysis:', response);
      setMode('approve');
    } catch (err) {
      setError('❌ Erreur lors de l\'analyse: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Mode 2: Générer ET envoyer (Auto-envoi)
  const handleAutoGenerateAndSend = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🚀 Mode AUTO: Générer + Envoyer...');
      const response = await gmailAPI.generateAndSendReply(
        email.id,
        userId,
        'professional'
      );
      
      setGeneratedReply(response.data.reply);
      setSent(true);
      setMode('sent');
      
      // Notification de succès
      alert('✅ Réponse générée et envoyée avec succès!');
    } catch (err) {
      setError('❌ Erreur: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 👁️ Mode 3: Générer et attendre l'approbation
  const handleGenerateForApproval = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('👁️ Mode APPROVAL: Générer et attendre approbation...');
      const response = await gmailAPI.generateAndRequestApproval(
        email.id,
        userId,
        'professional'
      );
      
      setGeneratedReply(response.reply);
      setMode('approve');
    } catch (err) {
      setError('❌ Erreur lors de la génération: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✉️ Mode 4: Envoyer la réponse approuvée
  const handleSendApprovedReply = async () => {
    if (!generatedReply) {
      setError('Aucune réponse à envoyer');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('✉️ Envoi de la réponse approuvée...');
      const response = await gmailAPI.sendApprovedReply(
        email.id,
        userId,
        generatedReply
      );
      
      setSent(true);
      setMode('sent');
      alert('✅ Réponse envoyée avec succès!');
    } catch (err) {
      setError('❌ Erreur lors de l\'envoi: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Annuler et revenir
  const handleCancel = () => {
    setGeneratedReply(null);
    setMode('view');
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">{email.subject}</h3>
        <p className="text-sm text-gray-600">De: {email.senderEmail}</p>
      </div>

      {/* Badges d'analyse */}
      {analysis && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-700">Sentiment</label>
            <SentimentBadge sentiment={analysis.sentiment} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Priorité</label>
            <PriorityBadge priority={analysis.priority} />
          </div>
        </div>
      )}

      {/* Contenu de l'email */}
      <div className="bg-gray-50 rounded p-4 mb-6 max-h-40 overflow-y-auto">
        <p className="text-gray-700 text-sm">{email.body}</p>
      </div>

      {/* SECTION: Réponse générée */}
      {generatedReply && mode === 'approve' && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded p-4 mb-6">
          <h4 className="font-bold text-blue-900 mb-2">📝 Réponse proposée:</h4>
          <p className="text-gray-700 text-sm p-3 bg-white rounded border-l-4 border-blue-500">
            {generatedReply}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            ✏️ Vous pouvez éditer le texte avant d'envoyer
          </p>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Statut d'envoi */}
      {sent && mode === 'sent' && (
        <div className="bg-green-50 border-2 border-green-500 rounded p-4 mb-6">
          <p className="text-green-700 font-bold">✅ Réponse envoyée avec succès!</p>
          <p className="text-green-600 text-sm mt-2">
            L'email a été envoyé au {email.senderEmail}
          </p>
        </div>
      )}

      {/* BOUTONS - Mode 1: Voir seulement */}
      {mode === 'view' && (
        <div className="flex gap-3">
          {/* Bouton 1: Analyser seulement */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? '⏳ Analyse...' : '📊 Analyser'}
          </button>

          {/* Bouton 2: Générer + Attendre approbation */}
          <button
            onClick={handleGenerateForApproval}
            disabled={loading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? '⏳ Génération...' : '👁️ Générer (Approuver)'}
          </button>

          {/* Bouton 3: Générer + Envoyer automatiquement */}
          <button
            onClick={handleAutoGenerateAndSend}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold transition disabled:opacity-50 animate-pulse"
          >
            {loading ? '⏳ Envoi...' : '🚀 Auto (Gen + Envoi)'}
          </button>
        </div>
      )}

      {/* BOUTONS - Mode 2: Approbation */}
      {mode === 'approve' && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded font-semibold transition"
          >
            ❌ Annuler
          </button>
          <button
            onClick={handleSendApprovedReply}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-semibold transition disabled:opacity-50"
          >
            {loading ? '⏳ Envoi...' : '✉️ Envoyer'}
          </button>
        </div>
      )}

      {/* BOUTONS - Mode 3: Envoyé */}
      {mode === 'sent' && (
        <button
          onClick={() => setMode('view')}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-semibold transition"
        >
          🔄 Réinitialiser
        </button>
      )}

      {/* Info supplémentaire */}
      <div className="mt-6 pt-4 border-t text-xs text-gray-600">
        <p>
          🔒 Vos réponses sont chiffrées et sécurisées<br/>
          📧 Les emails sont envoyés depuis votre compte Gmail<br/>
          ⚡ Livraison instantanée
        </p>
      </div>
    </div>
  );
}