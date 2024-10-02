"use client"
import * as React from "react"
import Image from "next/image"
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import axios from "axios"

export default function Home() {
    const [components, setComponents] = React.useState([])
    React.useEffect(() => {
        axios.get("http://localhost:9409/test").then((res) => {
            console.log(res.data)
            setComponents(res.data)
        })
    }, [])
    return (
        <main className="bg-white">
            <div className="flex flex-wrap mt-6 ml-[31px] mr-[31px] mb-[30px]">
                <span className="absolute h-[54px] text-[32px]">Components: WCP</span>
                <div className="flex flex-wrap h-[54px] w-[415px] bg-[#D9D9D9] mx-auto justify-center content-center">
                    <span className="text-black text-[24px]">Download All</span>
                </div>
                <div className="absolute h-[54px] w-[546px] bg-[#D9D9D9] ml-auto right-[31px] justify-center content-center">
                    <span className="text-black text-[24px] ml-3">Search</span>
                    <MagnifyingGlassIcon className="absolute w-8 h-8 ml-auto right-[14px] bottom-[10px]"></MagnifyingGlassIcon>
                </div>
            </div>
            <div className="flex flex-wrap justify-center">
                {components.map((component) => {
                    return (
                        <div className="flex flex-wrap m-auto w-[256px] border-gray-200 border-2 rounded justify-center ml-6 mr-6 mb-6">
                            <Image className="rounded mb-5" src={"https://wcproducts.com/cdn/shop/files/WCP-1538_1024x1024.png?v=1713815460"} alt="Thumbnail" width={256} height={256} />
                            <span className="text-center text-[20px]">{component.name}</span>
                            <span className="text-center text-[20px]">{component.filename}</span>
                            <div className="flex flex-wrap bg-[#D9D9D9] w-[256px] h-[42px] justify-center content-center mt-3">
                                <span className="text-black text-[20px]">Download File</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </main>
    );
}