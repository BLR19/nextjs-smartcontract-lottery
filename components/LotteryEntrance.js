import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"
import { Bell } from "@web3uikit/icons"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const lotteryAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")

    const dispatch = useNotification()

    const {
        runContractFunction: enterLottery,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "enterLottery",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: lotteryAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    useEffect(() => {
        if (isWeb3Enabled) {
            console.log(`Network's chainId: ${chainId}`)
            updateUI()
            listenForWinnerToBePicked()
        }
    }, [isWeb3Enabled])

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numPlayersFromCall = (await getNumberOfPlayers()).toString()
        const recentWinnerFromCall = await getRecentWinner()
        setEntranceFee(entranceFeeFromCall) //using useState allows us to have a re-render so the variable entranceFee is updated before showing
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
    }

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }

    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction complete!",
            title: "Tx notification",
            position: "topR",
            icon: <Bell fontSize="50px" />,
        })
    }

    function listenForWinnerToBePicked() {
        const lottery = new ethers.Contract(lotteryAddress, abi, web3)
        //  const provider = await Moralis.enableWeb3();
        //  const lottery = new ethers.Contract(lotteryAddress, abi, provider);
        console.log("Waiting for a winner ...")
        return new Promise((resolve, reject) => {
            lottery.on("WinnerPicked", async () => {
                try {
                    await updateUI()
                    console.log("We got a winner!")
                    resolve()
                } catch (error) {
                    console.log(error)
                    reject(error)
                }
            })
        })
    }

    return (
        <>
            {lotteryAddress ? (
                <>
                    <div className="p-5">
                        <p>
                            Lottery entrance fee is:{" "}
                            {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                        </p>
                        <p>Number of players: {numPlayers}</p>
                        <p>Recent winner: {recentWinner}</p>
                    </div>
                    <button
                        className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async () => {
                            await enterLottery({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-6 w-6 border-b-2 rounded-full"></div>
                        ) : (
                            "Enter Lottery"
                        )}
                    </button>
                </>
            ) : (
                <div>No Lottery address detected</div>
            )}
        </>
    )
}
