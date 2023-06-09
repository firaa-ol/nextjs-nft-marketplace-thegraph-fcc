import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import nftAbi from "../constants/BasicNft.json";
import Image from "next/image";
import { Card, useNotification } from "web3uikit";
import { ethers } from "ethers";
import UpdateListingModal from "./UpdateListingModal";

const truncateStr = (fullStr: string, strLen: number) => {
  if (fullStr.length <= strLen) return fullStr;

  const separator = "...";
  const separatorLength = separator.length;
  const charsToShow = strLen - separatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};
//@ts-ignore
export default function NFTBox({
  //@ts-ignore
  price,
  //@ts-ignore
  nftAddress,
  //@ts-ignore
  tokenId,
  //@ts-ignore
  marketplaceAddress,
  //@ts-ignore
  seller,
}) {
  const { isWeb3Enabled, account } = useMoralis();
  const [imageURI, setImageURI] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [showModal, setShowModal] = useState(false);
  const hideModal = () => setShowModal(false);
  const dispatch = useNotification();

  const { runContractFunction: getTokenURI } = useWeb3Contract({
    abi: nftAbi,
    contractAddress: nftAddress,
    functionName: "TOKEN_URI",
    params: {
      tokenId: tokenId,
    },
  });

  const { runContractFunction: buyItem } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "buyItem",
    msgValue: price,
    params: {
      nftAddress: nftAddress,
      tokenId: tokenId,
    },
  });

  async function updateUI() {
    const tokenURI = (await getTokenURI()) as string;
    console.log(`The TokenURI is ${tokenURI}`);
    if (tokenURI) {
      const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      const tokenURIResponse = await (await fetch(requestURL)).json();
      const imageURI = tokenURIResponse.image;
      const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/");
      setImageURI(imageURIURL);
      setTokenName(tokenURIResponse.name);
      setTokenDescription(tokenURIResponse.description);
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUI();
    }
  }, [isWeb3Enabled]);

  const isOwnedByUser = seller === account || seller === undefined;
  const formattedSellerAddress = isOwnedByUser
    ? "you"
    : truncateStr(seller || "", 15);

  const handleCardClick = () => {
    isOwnedByUser
      ? setShowModal(true)
      : buyItem({
          onError: (error) => console.log(error),
          onSuccess: () => handleBuyItemSuccess(),
        });
  };

  const handleBuyItemSuccess = async () => {
    dispatch({
      type: "success",
      message: "item bought!",
      title: "Item Bought",
      position: "topR",
    });
  };

  return (
    <div>
      {imageURI ? (
        <div>
          <UpdateListingModal
            isVisible={showModal}
            tokenId={tokenId}
            marketplaceAddress={marketplaceAddress}
            nftAddress={nftAddress}
            onClose={hideModal}
          />
          <Card
            title={tokenName}
            description={tokenDescription}
            onClick={handleCardClick}
          >
            <div className="p-2">
              <div className="flex flex-col items-end gap-2">
                <div>#{tokenId}</div>
                <div className="italic text-sm">
                  Owned By {formattedSellerAddress}
                </div>
                <Image
                  loader={() => imageURI}
                  src={imageURI}
                  height="200"
                  width="200"
                  alt={tokenName}
                />
                <div className="font-bold">
                  {ethers.utils.formatUnits(price, "ether")} ETH
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div>Loading......</div>
      )}
    </div>
  );
}
