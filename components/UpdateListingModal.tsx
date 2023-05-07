import { useState } from "react";
import { Modal, Input, useNotification } from "web3uikit";
import { useWeb3Contract } from "react-moralis";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import { ethers } from "ethers";
import { error } from "console";

export default function UpdateListingModal({
  //@ts-ignore
  nftAddress,
  //@ts-ignore
  tokenId,
  //@ts-ignore
  isVisible,
  //@ts-ignore
  marketplaceAddress,
  //@ts-ignore
  onClose,
}) {
  const dispatch = useNotification();
  const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState("");

  const handleUpdateListingSuccess = () => {
    console.log("updating listing...");
    dispatch({
      type: "success",
      message: "listing updated",
      title: "Listing updated - please referesh (and move blocks)",
      position: "topR",
    });
    onClose && onClose();
    setPriceToUpdateListingWith("0");
  };

  const { runContractFunction: updateListing } = useWeb3Contract({
    abi: nftMarketplaceAbi,
    contractAddress: marketplaceAddress,
    functionName: "updateListing",
    params: {
      nftAddress: nftAddress,
      tokenId: tokenId,
      newPrice: ethers.utils.parseEther(priceToUpdateListingWith || "0"),
    },
  });

  return (
    <Modal
      isVisible={isVisible}
      onOk={() => {
        updateListing({
          onError: (error) => console.log(error),
          onSuccess: () => handleUpdateListingSuccess(),
        });
      }}
      onCancel={onClose}
      onCloseButtonPressed={onClose}
    >
      <Input
        label="Update listing price in L1 currency (ETH)"
        name="New Listing Price"
        type="number"
        onChange={(event) => {
          setPriceToUpdateListingWith(event.target.value);
        }}
      />
    </Modal>
  );
}
