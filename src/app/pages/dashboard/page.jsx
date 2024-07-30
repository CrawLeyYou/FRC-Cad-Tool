"use client"
import * as React from "react"
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function Home() {
    return (
        <main className="bg-white">
            <div className="flex h-screen">
                <Card className="m-auto bg-white border-gray-400 w-[350px]">
                    <CardHeader>
                        <CardTitle className="flex text-black justify-center">FRC Cad Tools</CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </main>
    );
}