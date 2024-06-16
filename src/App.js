import React, { useState, useEffect } from 'react';
import './App.css';
import { gql, useQuery } from '@apollo/client';

function App() {
  const GET_NFTS = gql`
    query GetNFTs {
      nfts {
        tokenId
        tokenUri
        owner
      }
    }
  `;
  const { data, loading, error } = useQuery(GET_NFTS);
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUri, setTokenUri] = useState('');
  const [tokenId, setTokenId] = useState(0);
  const [owner, setOwner] = useState('User:defaultOwner');
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [viewNFTs, setViewNFTs] = useState(false);
  const API_TOKEN = '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';

  useEffect(() => {
    const savedNFTs = JSON.parse(localStorage.getItem('mintedNFTs'));
    if (savedNFTs) {
      setMintedNFTs(savedNFTs);
    }
  }, []);

  const saveNFTs = (nfts) => {
    localStorage.setItem('mintedNFTs', JSON.stringify(nfts));
  };

  const generateImage = async () => {
    setIsLoading(true);
    const response = await fetch(
      "https://api-inference.huggingface.co/models/prompthero/openjourney",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ inputs: inputText }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate image");
    }
    const blobData = await response.blob();
    const objectURL = URL.createObjectURL(blobData);
    setImageUrl(objectURL);

    const reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = () => {
      const base64data = reader.result;
      setTokenUri(base64data);
    };

    setIsLoading(false);
  };

  const mintNFT = () => {
    const newNFT = { tokenId, tokenUri };
    const updatedNFTs = [...mintedNFTs, newNFT];
    setMintedNFTs(updatedNFTs);
    saveNFTs(updatedNFTs);
    setTokenId(tokenId + 1);
  };

  const handleMint = () => {
    mintNFT();
  };

  const handleTransfer = (id) => {
    const newOwner = prompt("Enter new owner address:");
    if (newOwner) {
      const updatedNFTs = mintedNFTs.map(nft => 
        nft.tokenId === id ? { ...nft, owner: newOwner } : nft
      );
      setMintedNFTs(updatedNFTs);
      saveNFTs(updatedNFTs);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="App">
      <header className="App-header">
        <h1>BlockBloom NFT Generator</h1>
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter AI prompt"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button onClick={generateImage}>Generate AI NFT Image</button>
        </div>
        {isLoading && <p>Loading...</p>}
        {imageUrl && <img src={imageUrl} alt="Generated NFT" className="image-display" />}
        <div className="button-container">
          <button onClick={handleMint}>Mint NFT</button>
          <button onClick={() => setViewNFTs(!viewNFTs)}>View NFTs</button>
        </div>
        {viewNFTs && (
          <div className="minted-nfts">
            <h2>Minted NFTs</h2>
            {mintedNFTs.map((nft, index) => (
              <div key={index} className="nft-card">
                <p>Token ID: {nft.tokenId}</p>
                <img src={nft.tokenUri} alt={`NFT ${nft.tokenId}`} className="image-display" />
                <p>Owner: {nft.owner || owner}</p>
                <button onClick={() => handleTransfer(nft.tokenId)}>Transfer NFT</button>
              </div>
            ))}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;