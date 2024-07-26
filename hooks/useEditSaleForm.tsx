import { useToast } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { psycSaleContractConfig } from "@/lib/sale-contract-config";
import { useCustomToasts } from "@/hooks/useCustomToasts";
import { useResize } from "@/hooks/useResize";
import { type Address, parseUnits } from "viem";
import { getAddresses, uploadAddresses } from "@/lib/server-utils";
import { getMerkleRoot, getNewAddresses } from "@/utils/saleUtils";
import { useGetCurrentSaleValues } from "./useGetCurrentSaleValues";

export const useEditSaleForm = (
  address: string | undefined,
  setOpenEditSale: React.Dispatch<React.SetStateAction<boolean>>,
  id: string,
  triggerNftSaleUpdate: () => void,
  refetchSalesData: () => void
) => {
  const toast = useToast();
  const { width } = useResize();
  const {
    ceilingPrice: currentCeilingPrice,
    floorPrice: currentFloorPrice,
    ipfsHash: currentIpfsHash,
    saleBatches: currentSaleBatch
  } = useGetCurrentSaleValues(id, width);
  const { showErrorToast, showCustomErrorToast, showSuccessToast } =
    useCustomToasts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const [floorAndCeilingPriceHash, setFloorAndCeilingPriceHash] = useState<
    `0x${string}` | undefined
  >(undefined);
  const [whitelistHash, setWhitelistHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [switchSaleStatusHash, setSwitchSaleStatusHash] = useState<
    Address | undefined
  >(undefined);
  const {
    isSuccess: floorAndCeilingPriceSuccess,
    error: floorAndCeilingPriceError
  } = useWaitForTransactionReceipt({ hash: floorAndCeilingPriceHash });

  const { isSuccess: whitelistSuccess, error: whitelistError } =
    useWaitForTransactionReceipt({
      hash: whitelistHash
    });

  const { isSuccess: switchSaleStatusSuccess, error: switchSaleStatusError } =
    useWaitForTransactionReceipt({
      hash: switchSaleStatusHash
    });

  const handleEditSale = async (
    e: React.FormEvent<HTMLFormElement>,
    batchID: string,
    addressesToRemove: string[],
    newAddresses: string[],
    existingAddresses: string[],
    newFloorPrice: string,
    newCeilingPrice: string,
    isPausedLocal: boolean,

    width: number
  ) => {
    e.preventDefault();
    if (!address) {
      toast({
        title: "Please connect your wallet first",
        position: "top-right",
        status: "error",
        isClosable: true
      });
      return;
    }
    setIsSubmitting(true);

    const ceilingPriceHasChanged =
      parseUnits(newCeilingPrice, 18).toString() !== currentCeilingPrice;
    const floorPriceHasChanged =
      parseUnits(newFloorPrice, 18).toString() !== currentFloorPrice;
    const saleStatusMustChange = isPausedLocal !== currentSaleBatch[6];

    const addressesToSubmit = getNewAddresses(
      addressesToRemove,
      newAddresses,
      existingAddresses
    );

    try {
      const currentAddresses = await getAddresses(currentIpfsHash);
      const isPausedContract = currentSaleBatch[6];
      if (
        !ceilingPriceHasChanged &&
        !floorPriceHasChanged &&
        JSON.stringify(addressesToSubmit.sort()) ===
          JSON.stringify(currentAddresses.sort()) &&
        !saleStatusMustChange
      ) {
        showErrorToast("No changes to submit!", width);
        setIsSubmitting(false);
        return;
      }

      if (
        JSON.stringify(addressesToSubmit.sort()) !==
        JSON.stringify(currentAddresses.sort())
      ) {
        const newIpfsHash = await uploadAddresses(addressesToSubmit);
        const newMerkleRoot = getMerkleRoot(addressesToSubmit);
        const merklerootResponse = await writeContractAsync({
          ...psycSaleContractConfig,
          functionName: "updateMerkleRoot",
          args: [batchID, newMerkleRoot, newIpfsHash]
        });
        setWhitelistHash(merklerootResponse);
      }

      if (ceilingPriceHasChanged && floorPriceHasChanged) {
        const floorAndCeilingPriceResponse = await writeContractAsync({
          ...psycSaleContractConfig,
          functionName: "changeFloorAndCeilingPriceOfBatch",
          args: [
            batchID,
            parseUnits(newFloorPrice, 18),
            parseUnits(newCeilingPrice, 18)
          ]
        });
        setFloorAndCeilingPriceHash(floorAndCeilingPriceResponse);
      } else if (ceilingPriceHasChanged && !floorPriceHasChanged) {
        const floorAndCeilingPriceResponse = await writeContractAsync({
          ...psycSaleContractConfig,
          functionName: "changeFloorAndCeilingPriceOfBatch",
          args: [batchID, currentFloorPrice, parseUnits(newCeilingPrice, 18)]
        });
        setFloorAndCeilingPriceHash(floorAndCeilingPriceResponse);
      } else if (!ceilingPriceHasChanged && floorPriceHasChanged) {
        const floorAndCeilingPriceResponse = await writeContractAsync({
          ...psycSaleContractConfig,
          functionName: "changeFloorAndCeilingPriceOfBatch",
          args: [batchID, parseUnits(newFloorPrice, 18), currentCeilingPrice]
        });
        setFloorAndCeilingPriceHash(floorAndCeilingPriceResponse);
      }

      if (isPausedLocal !== isPausedContract) {
        const switchSaleStatusResponse = await writeContractAsync({
          ...psycSaleContractConfig,
          functionName: "switchBatchStatus",
          args: [batchID]
        });
        setSwitchSaleStatusHash(switchSaleStatusResponse);
      }

      if (isSuccess) {
        showSuccessToast("Success! Your sale has been edited!", width);
      }
    } catch (error) {
      const message = (error as Error).message || "An error occurred";
      setIsSubmitting(false);
      setFloorAndCeilingPriceHash(undefined);
      setWhitelistHash(undefined);
      console.log(message);
      console.error(message, "error");
      showCustomErrorToast(message, width);
    }
  };

  useEffect(() => {
    if (floorAndCeilingPriceSuccess) {
      setIsSuccess(true);
    }

    if (whitelistSuccess) {
      setIsSuccess(true);
    }

    if (switchSaleStatusSuccess) {
      setIsSuccess(true);
    }

    if (floorAndCeilingPriceError) {
      setIsError(true);
    }

    if (switchSaleStatusError) {
      setIsError(true);
    }

    if (whitelistError) {
      setIsError(true);
    }
  }, [
    floorAndCeilingPriceError,
    floorAndCeilingPriceSuccess,
    whitelistError,
    whitelistSuccess,
    switchSaleStatusSuccess,
    switchSaleStatusError,
    isSuccess,
    isError,
    setOpenEditSale
  ]);

  useEffect(() => {
    if (isSuccess) {
      triggerNftSaleUpdate();
      refetchSalesData();
      setIsSubmitting(false);
      setOpenEditSale(false);
      setFloorAndCeilingPriceHash(undefined);
      setWhitelistHash(undefined);
      setIsSuccess(true);
      setIsError(false);
      showSuccessToast("Your sale has been edited!", width);
      return;
    }

    if (isError) {
      showErrorToast("An error has occurred. Please try again later", width);
      setIsSubmitting(false);
      setOpenEditSale(false);
      setFloorAndCeilingPriceHash(undefined);
      setWhitelistHash(undefined);
      setIsSuccess(false);
      setIsError(true);
    }
  }, [isSuccess, isError, setOpenEditSale]);

  return {
    handleEditSale,
    isSubmitting
  };
};
