import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Flex,
  Button,
  Image,
  Table,
  TableContainer,
  Tr,
  Tbody,
  Td,
  Switch,
  Grid
} from "@chakra-ui/react";
import { useWizard } from "react-use-wizard";
import CreateClaimButton from "./claim-button";
import { dummyClaims } from "./dummyData";
import { useState } from "react";
import { getExpirationStatus } from "@/utils/getExpirationStatus";

const EmptyState = () => {
  const { nextStep } = useWizard();
  return (
    <Flex
      gap={8}
      direction={"column"}
      p={{
        base: "4",
        md: "8"
      }}
    >
      <Flex
        direction={"column"}
        alignItems={"center"}
        justifyContent={"space-between"}
        border={"1px solid rgba(242,190,190,0.45)"}
        borderRadius={"20px"}
        w={"fit-content"}
        marginX={"auto"}
        padding={{
          base: "4",
          md: "6"
        }}
      >
        <Image src="/psydao-logo-light.png" />
        <Flex
          direction={"row"}
          justifyContent={"space-around"}
          alignItems={"center"}
          gap={4}
        >
          <Image src="/diagonal-rectangle.png" />
          <Text
            fontSize={{
              base: "16px",
              md: "18px"
            }}
          >
            There are no claims rewards added yet
          </Text>
          <Image src="/diagonal-rectangle.png" />
        </Flex>
      </Flex>
      <CreateClaimButton
        handleClick={nextStep}
        fullWidth={false}
        buttonText={"Add a new claim reward"}
      />
    </Flex>
  );
};

const PsyIcon = () => {
  return (
    <Flex alignItems={"center"} gap={2} borderRadius={"18px"}>
      <Box minW={"20px"} borderRadius={"100%"} bg={"white"}>
        <Image src="/purple-logo.svg" width={5} height={5} alt="PSY icon" />
      </Box>
      <Text fontSize={14} fontWeight="600" fontFamily={"Poppins"}>
        PSY
      </Text>
    </Flex>
  );
};

const AdminViewClaims = () => {
  const { previousStep, nextStep } = useWizard();
  //  remove showEmptyState when done
  const [showEmptyState, setShowEmptyState] = useState(false);

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
            as="h2"
            fontSize={{ base: "24px", sm: "40px" }}
            fontStyle={{
              base: "italic",
              sm: "normal"
            }}
            lineHeight={{ base: "24px", sm: "40px" }}
            color={"#269200"}
          >
            Create Claims
          </Text>
          <Box position={"absolute"} right={2}>
            Empty state
            <Switch
              isChecked={showEmptyState}
              onChange={() => setShowEmptyState(!showEmptyState)}
              id="show-empty-state"
              ml={2}
            />
          </Box>
        </Flex>
      </Flex>
      {/* remove showEmptyState when done  */}
      {showEmptyState && <EmptyState />}
      {!showEmptyState && (
        <>
          <TableContainer>
            <Table variant="simple">
              <Tbody>
                {dummyClaims.map((claim, index) => (
                  <Tr key={index} fontFamily={"Inter Medium"} borderBottom={"1px solid #E9BDBD"}>
                    <Grid
                      templateColumns={{
                        base: "minmax(170px, 1fr)",
                        md: "repeat(auto-fit, minmax(170px, 1fr))"
                      }}
                      padding={6}
                      justifyContent={"space-between"}
                    >
                      <Box>Claim ({claim.batchNumber})</Box>
                      <Box>{getExpirationStatus(claim.expiry)}</Box>
                      <Box>
                        <Flex
                          justifyContent={{
                            base: "flex-start",
                            md: "flex-end"
                          }}
                          alignItems="center"
                        >
                          {claim.totalClaimable} <PsyIcon />
                        </Flex>
                      </Box>
                    </Grid>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Box
            position={"fixed"}
            bottom={0}
            w={"100%"}
            boxShadow={"0px -2px 25.6px 0px rgba(0, 0, 0, 0.25)"}
            p={6}
            background="#fffafa"
          >
            <CreateClaimButton
              handleClick={nextStep}
              fullWidth={true}
              buttonText={"Create"}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default AdminViewClaims;
