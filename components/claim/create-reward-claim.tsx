import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Text, Flex, Button, Input, Image, Grid } from "@chakra-ui/react";
import { useWizard } from "react-use-wizard";
import CreateClaimButton from "./claim-button";
import React, { useCallback, useEffect, useState } from "react";
import CustomDatePicker from "./date-time-input";
import { useCreateNewClaimableBatch } from "@/services/web3/useCreateNewClaimableBatch";
import { useGetMinimumClaimDeadline } from "@/services/web3/useGetMinimumClaimDeadline";
import { getDeadlineTimeStamp } from "@/utils/getDeadlineTimeStamp";
import { useApprovePsy } from "@/services/web3/useApprovePsy";

const Section = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      borderBottom={"1px solid #E9BDBD"}
      fontSize={{
        base: "16px",
        md: "18px"
      }}
      fontFamily={"Inter Medium"}
      fontWeight={"400"}
      p={"6"}
    >
      {children}
    </Box>
  );
};

type Claim = {
  fromDate: Date | null;
  toDate: Date | null;
  claimDeadline: Date | null;
  amount: string;
};

const CreateRewardClaim = () => {
  const { previousStep } = useWizard();
  const [loading, setLoading] = useState(false);
  const [claimDeadlineAsString, setClaimDeadlineAsString] = useState("");
  const [claimInput, setClaimInput] = useState<Claim>({
    fromDate: null,
    toDate: null,
    claimDeadline: null,
    amount: "2"
  });

  const { minimumClaimDeadline, isSuccess, refetch } =
    useGetMinimumClaimDeadline();

  const { approve, data } = useApprovePsy();
  console.log({ data });

  console.log(minimumClaimDeadline?.toString());

  useEffect(() => {
    const claimDeadline = getDeadlineTimeStamp(
      claimInput.fromDate?.getTime() as number,
      minimumClaimDeadline?.toString()
    );
    setClaimDeadlineAsString(claimDeadline);
    console.log({ claimDeadlineAsString });
    // setClaimInput({
    //   ...claimInput,
    //   claimDeadline: new Date(claimDeadline)
    // })
  }, [claimInput.fromDate, minimumClaimDeadline]);

  const {
    createNewClaimableBatch,
    isConfirmed,
    isConfirming,
    isPending,
    error
  } = useCreateNewClaimableBatch();

  const callDistributionAPI = useCallback(async () => {
    setLoading(true);
    const startTimeStamp = claimInput.fromDate?.getTime();
    const endTimeStamp = claimInput.toDate?.getTime();
    const claimDeadline = claimInput.claimDeadline?.getTime();
    const claimDeadlineTimeStamp = Math.floor((claimDeadline as number) / 1000);

    const data = {
      startTimeStamp: Math.floor((startTimeStamp as number) / 1000),
      endTimeStamp: Math.floor((endTimeStamp as number) / 1000),
      totalAmountOfTokens: claimInput.amount
    };

    console.log('amount', data.totalAmountOfTokens);

    try {
      const response = await fetch("/api/distribution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Error:", result.error);
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log(result.proof, claimDeadlineAsString, result.ipfsHash);
      console.log("Merkle Tree:", result);

      console.log("Calling createNewClaimableBatch");
      await createNewClaimableBatch(
        result.merkleRoot,
        claimDeadlineAsString,
        result.ipfsHash
      );

      console.log("func", { isConfirmed, isConfirming, isPending, error });
      setLoading(false);
    } catch (error) {
      console.error("Error calling API:", error);
      setLoading(false);
    }
  }, [createNewClaimableBatch, claimInput, claimDeadlineAsString]);

  return (
    <Box height={"100%"}>
      <Flex
        alignItems={"center"}
        justifyContent={"space-between"}
        borderBottom={"1px solid #E9BDBD"}
      >
        <Flex
          width={"100%"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          direction={"row"}
          gap={1.5}
          py={6}
        >
          <Button
            onClick={previousStep}
            bg={"none"}
            _hover={{
              background: "none"
            }}
          >
            <ArrowBackIcon h={6} w={6} color={"#F2BEBE"} />
          </Button>
          <Text
            px={2}
            as="h2"
            fontSize={{ base: "24px", sm: "40px" }}
            fontStyle={{
              base: "italic",
              sm: "normal"
            }}
            lineHeight={{ base: "24px", sm: "40px" }}
            color={"#269200"}
          >
            Add a new reward claim
          </Text>
        </Flex>
      </Flex>
      <Box overflow={"scroll"} paddingBottom={"90px"}>
        <Section>
          <Flex
            gap={3}
            direction={{
              sm: "column",
              md: "row"
            }}
          >
            <Image width={6} src="/icons/alert-triangle.svg" />
            <Text color={"#E9B15B"}>
              Please note that once claim rewards are launched, there will be no
              option to modify or update them.
            </Text>
          </Flex>
        </Section>
        <Section>
          <Text>
            Rewards for DAO members who participate in proposal voting
          </Text>
        </Section>
        <Section>
          <Flex
            alignItems={{
              sm: "start",
              md: "center"
            }}
            wrap={"wrap"}
            gap={4}
            direction={{
              sm: "column",
              md: "row"
            }}
            justifyContent={"space-between"}
          >
            <Text>Participation period</Text>
            <Flex
              gap={4}
              wrap={"wrap"}
              direction={{
                sm: "column",
                md: "row"
              }}
            >
              <CustomDatePicker
                label="From"
                selectedDate={claimInput.fromDate}
                setSelectedDate={(date) =>
                  setClaimInput({
                    ...claimInput,
                    fromDate: date
                  })
                }
              />
              <CustomDatePicker
                label="To"
                selectedDate={claimInput.toDate}
                setSelectedDate={(date) =>
                  setClaimInput({
                    ...claimInput,
                    toDate: date
                  })
                }
              />
            </Flex>
          </Flex>
        </Section>
        <Section>
          <Flex
            alignItems={{
              sm: "start",
              md: "center"
            }}
            wrap={"wrap"}
            gap={4}
            direction={{
              sm: "column",
              md: "row"
            }}
            justifyContent={"space-between"}
          >
            <Text>Claim deadline</Text>
            <CustomDatePicker
              label="Date"
              selectedDate={claimInput.claimDeadline}
              setSelectedDate={(deadline) =>
                setClaimInput({
                  ...claimInput,
                  claimDeadline: deadline
                })
              }
            />
          </Flex>
        </Section>
        <Section>
          <Grid
            alignItems="center"
            justifyContent={"space-between"}
            gap={4}
            templateColumns={{
              base: "1fr",
              md: "1fr 2fr"
            }}
          >
            <Text>Amount</Text>
            <Box
              display="flex"
              bg="#FBF6F8"
              alignItems="center"
              borderRadius="xl"
              boxShadow="inner"
              justifyContent={"space-between"}
              gap={{ base: 1, sm: 4 }}
              p="16px"
              w={{ base: "100%", md: "auto" }}
            >
              <Input
                type="number"
                step={0.001}
                w={{ base: "100%" }}
                fontSize="18px"
                fontFamily={"Inter"}
                value={claimInput.amount}
                onChange={(e) => {
                  setClaimInput({
                    ...claimInput,
                    amount: e.target.value
                  });
                }}
                required
                border={"none"}
                focusBorderColor="transparent"
                onWheel={(e) => e.currentTarget.blur()}
              />
              <Flex
                alignItems={"center"}
                gap={2}
                borderRadius={"18px"}
                p={"8px 16px"}
              >
                <Box minW={"20px"} borderRadius={"100%"} bg={"white"}>
                  <Image
                    src="/purple-logo.svg"
                    width={5}
                    height={5}
                    alt="PSY icon"
                  />
                </Box>
                <Text fontSize={14} fontWeight="600" fontFamily={"Poppins"}>
                  PSY
                </Text>
              </Flex>
            </Box>
          </Grid>
        </Section>
        <Box
          position={"fixed"}
          bottom={0}
          w={"100%"}
          boxShadow={"0px -2px 25.6px 0px rgba(0, 0, 0, 0.25)"}
          p={6}
          background="#fffafa"
        >
          {/* <CreateClaimButton
            isLoading={loading}
            loadingText={"Creating..."}
            handleClick={approve}
            fullWidth={true}
            buttonText={"Approve"}
          /> */}
          <CreateClaimButton
            isLoading={loading}
            loadingText={"Creating..."}
            handleClick={callDistributionAPI}
            fullWidth={true}
            buttonText={"Create"}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateRewardClaim;
