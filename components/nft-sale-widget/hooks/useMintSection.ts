import { useState, useEffect, useMemo, useCallback } from "react";
import { formatUnits } from "viem";

import { useSaleWidget } from "@/providers/SaleWidgetContext";

import usePrivateSale from "@/hooks/usePrivateSale";
import { useGetAddresses } from "@/hooks/useGetAddresses";
import { useBatchSoldOut } from "@/hooks/useBatchSoldOut";
import useImageData from "@/hooks/useImageData";
import useRandomImage from "@/hooks/useRandomImage";

import getAvailableTokenIds from "@/utils/getAvailableTokenIds";

export const useMintSection = (isRandom: boolean) => {
  const { activeSale, isOriginal } = useSaleWidget();
  const [isOpen, setIsOpen] = useState(false);
  const [whitelist, setWhitelist] = useState<{ [key: string]: string[] }>({});

  const { isLoading: isPrivateSaleLoading, isPrivateSale } = usePrivateSale();
  const { isLoading: isAddressesLoading, getAddresses } = useGetAddresses();
  const isSoldOut = useBatchSoldOut(activeSale, isPrivateSale);

  const imageIds = useMemo(
    () => activeSale?.tokensOnSale.map((token) => token.tokenID) ?? [],
    [activeSale]
  );
  const { imageUris, loading: imageUrisLoading } = useImageData(imageIds);
  const currentImageIndex = useRandomImage(isRandom, imageUris);

  const handleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  const activeTokens = useMemo(() => {
    if (!activeSale) return [];
    const availableTokens = getAvailableTokenIds(activeSale, isOriginal);
    return availableTokens.map((token, index) => ({
      src: imageUris[index] ?? "",
      price: formatUnits(BigInt(activeSale.floorPrice), 18),
      isSold: false,
      batchId: activeSale.batchID,
      tokenId: token.tokenID,
      ipfsHash: activeSale.ipfsHash,
      whitelist: whitelist[activeSale.ipfsHash] ?? [],
      balance: "0"
    }));
  }, [activeSale, imageUris, whitelist, isOriginal]);

  const randomToken = useMemo(() => {
    if (!isRandom) return null;
    if (activeTokens.length > 0) {
      return activeTokens[currentImageIndex % activeTokens.length] ?? null;
    }
    if (activeSale) {
      return {
        src: imageUris[0] ?? "",
        price: formatUnits(BigInt(activeSale.floorPrice), 18),
        isSold: false,
        batchId: activeSale.batchID,
        tokenId: "0",
        ipfsHash: activeSale.ipfsHash,
        whitelist: whitelist[activeSale.ipfsHash] ?? [],
        balance: "0"
      };
    }
    return null;
  }, [
    isRandom,
    activeTokens,
    currentImageIndex,
    activeSale,
    imageUris,
    whitelist
  ]);

  useEffect(() => {
    const fetchWhitelist = async () => {
      if (activeSale) {
        try {
          const addresses = await getAddresses(activeSale.ipfsHash);
          if (addresses && !isAddressesLoading) {
            setWhitelist((prev) => ({
              ...prev,
              [activeSale.ipfsHash]: addresses
            }));
          }
        } catch (error) {
          console.error("Error fetching whitelist addresses:", error);
        }
      }
    };

    void fetchWhitelist();
  }, [activeSale, getAddresses, isAddressesLoading]);

  const privateSaleStatus = !isPrivateSaleLoading && isPrivateSale;

  return {
    isOpen,
    handleModal,
    activeSale,
    isOriginal,
    randomToken,
    activeTokens,
    imageUris,
    imageUrisLoading,
    privateSaleStatus,
    isAddressesLoading,
    isSoldOut,
    whitelist,
    currentImageIndex,
    tokens: activeSale?.tokensOnSale ?? []
  };
};