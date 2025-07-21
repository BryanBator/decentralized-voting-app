import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import VotingContractABI from './VotingContract.json';

// Contract-Adresse (wird beim lokalen Deployment gesetzt)
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

interface VotingInfo {
  title: string;
  totalVotes: number;
  totalCandidates: number;
  isVotingOpen: boolean;
}

function App() {
  // State Management
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // MetaMask Connection
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('MetaMask ist nicht installiert! Bitte installiere MetaMask.');
        return;
      }

      setLoading(true);
      
      // MetaMask Account anfordern
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      const userAccount = accounts[0];
      setAccount(userAccount);

      // Provider und Contract Setup
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const signer = await web3Provider.getSigner();
      const votingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VotingContractABI.abi,
        signer
      );
      setContract(votingContract);

      console.log('Wallet verbunden:', userAccount);
      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Verbinden der Wallet:', error);
      setLoading(false);
    }
  };

  // Contract-Daten laden
  const loadContractData = async () => {
    if (!contract) return;

    console.log("🔍 Loading contract data...");
    console.log("Contract:", contract);
    console.log("Account:", account);

    try {
      setLoading(true);

      // Voting-Informationen laden
      const info = await contract.getVotingInfo();
      setVotingInfo({
        title: info.title,
        totalVotes: Number(info.totalVoteCount),
        totalCandidates: Number(info.totalCandidates),
        isVotingOpen: info.isVotingOpen,
      });

      // Kandidaten laden
      if (Number(info.totalCandidates) > 0) {
        const candidateData = await contract.getAllCandidates();
        const candidateList: Candidate[] = candidateData[0].map((id: bigint, index: number) => ({
          id: Number(id),
          name: candidateData[1][index],
          voteCount: Number(candidateData[2][index]),
        }));
        setCandidates(candidateList);
      }

      // Owner-Status prüfen
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());

      // Voting-Status des aktuellen Users prüfen
      if (account) {
        const voterInfo = await contract.getVoter(account);
        setHasVoted(voterInfo.hasVoted);
      }

      setLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Contract-Daten:', error);
      setLoading(false);
    }
  };

  // Vote abgeben
  const vote = async (candidateId: number) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.vote(candidateId);
      await tx.wait();
      
      alert('Stimme erfolgreich abgegeben!');
      await loadContractData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Abstimmen:', error);
      alert('Fehler beim Abstimmen. Siehe Konsole für Details.');
      setLoading(false);
    }
  };

  // Contract-Daten laden, wenn Contract verfügbar ist
  useEffect(() => {
    if (contract && account) {
      loadContractData();
    }
  }, [contract, account]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🗳️ Decentralized Voting App
          </h1>
          <p className="text-gray-600">
            Powered by Ethereum Smart Contracts
          </p>
        </header>

        {/* Wallet Connection */}
        {!account ? (
          <div className="card max-w-md mx-auto text-center">
            <h2 className="text-xl font-semibold mb-4">Wallet verbinden</h2>
            <p className="text-gray-600 mb-6">
              Verbinde deine MetaMask Wallet, um an der Abstimmung teilzunehmen.
            </p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Verbinde...' : '🦊 MetaMask verbinden'}
            </button>
          </div>
        ) : (
          <>
            {/* Account Info */}
            <div className="card mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Verbundene Wallet:</p>
                  <p className="font-mono text-sm">{account}</p>
                  {isOwner && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mt-1">
                      👑 Contract Owner
                    </span>
                  )}
                </div>
                <button
                  onClick={loadContractData}
                  className="btn-secondary"
                  disabled={loading}
                >
                  🔄 Aktualisieren
                </button>
              </div>
            </div>

            {/* Voting Info */}
            {votingInfo && (
              <div className="card mb-6">
                <h2 className="text-2xl font-semibold mb-4">{votingInfo.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-500">{votingInfo.totalCandidates}</p>
                    <p className="text-sm text-gray-600">Kandidaten</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-500">{votingInfo.totalVotes}</p>
                    <p className="text-sm text-gray-600">Stimmen</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${votingInfo.isVotingOpen ? 'text-success-500' : 'text-gray-400'}`}>
                      {votingInfo.isVotingOpen ? '✅' : '❌'}
                    </p>
                    <p className="text-sm text-gray-600">Voting Status</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${hasVoted ? 'text-success-500' : 'text-gray-400'}`}>
                      {hasVoted ? '✅' : '❌'}
                    </p>
                    <p className="text-sm text-gray-600">Deine Stimme</p>
                  </div>
                </div>
              </div>
            )}

            {/* Kandidaten */}
            {candidates.length > 0 ? (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Kandidaten</h3>
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">{candidate.name}</h4>
                        <p className="text-sm text-gray-600">{candidate.voteCount} Stimmen</p>
                      </div>
                      {votingInfo?.isVotingOpen && !hasVoted && (
                        <button
                          onClick={() => vote(candidate.id)}
                          disabled={loading}
                          className="btn-primary"
                        >
                          {loading ? '...' : 'Wählen'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <p className="text-gray-600">Noch keine Kandidaten verfügbar.</p>
                {isOwner && (
                  <p className="text-sm text-gray-500 mt-2">
                    Als Owner kannst du Kandidaten über die Smart Contract Funktionen hinzufügen.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p>Verarbeite Transaction...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;