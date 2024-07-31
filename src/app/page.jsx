'use client'
import * as React from "react"
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select"
import useWebSocket from 'react-use-websocket';
import { EventEmitter } from "../lib/utils"
import axios from "axios"

export default function Page() {
    let socketEvent = new EventEmitter()
    const { sendMessage } = useWebSocket("ws://localhost:9410", {
        onMessage: (msg) => {
            socketEvent.emit("socketMessage", msg.data)
        }
    });
    const [progress, setProgress] = React.useState(0)
    const [maxValue, setMaxValue] = React.useState(200)
    const [open, dialogSetOpen] = React.useState(false);
    const router = useRouter()
    const [cancelRedirect, setCancelRedirect] = React.useState(false)
    const [selection, setSelection] = React.useState(null)
    const [optionsArr, setOptionsArr] = React.useState([])

    const redirectDashboard = () => {
        dialogSetOpen(false)
        setProgress(0)
        router.replace("/pages/dashboard")
    }

    socketEvent.on("socketMessage", async (msg) => {
        var data = JSON.parse(msg)
        switch (data.type) {
            case "push":
                setMaxValue(data.maxAmount)
                break;
            case "update":
                setProgress(data.currentAmount)
                if (maxValue == data.currentAmount && !cancelRedirect) {
                    redirectDashboard()
                }
            break
            case "redirect": 
                redirectDashboard()
            break
            default:
                break;
        }
    })

    React.useEffect(() => {
        axios.get("/options").then((res) => setOptionsArr(res.data.options))
    }, [])

    const fetchState = () => {
        sendMessage(JSON.stringify({ type: "fetch", selection: selection }))
    }

    const cancelFetch = () => {
        dialogSetOpen(false)
        setCancelRedirect(true)
        setProgress(0)
    }

    return (
        <main className="bg-white">
            <div className="flex h-screen">
                <Card className="m-auto bg-white border-gray-400 w-[350px]">
                    <CardHeader>
                        <CardTitle className="flex text-black justify-center">FRC Cad Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label>Select to fetch</Label>
                                    <Select onValueChange={setSelection}>
                                        <SelectTrigger id="seller">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent id="options" position="popper" key="31">
                                            {optionsArr.map((data, i) => {
                                                return <SelectItem key={i} value={data.id}>{data.name}</SelectItem>
                                            })}
                                            <SelectSeparator></SelectSeparator>
                                            <SelectItem value="serverdb">Offline DB</SelectItem>
                                            <SelectItem value="offline">Select Folder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <AlertDialog open={open} onOpenChange={dialogSetOpen}>
                            <AlertDialogTrigger asChild>
                                <Button className="bg-black text-white" onClick={fetchState}>Fetch</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Loading...</AlertDialogTitle>
                                    <Progress max={maxValue} value={progress} className="w-[60%]" />
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={cancelFetch}>Cancel</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}