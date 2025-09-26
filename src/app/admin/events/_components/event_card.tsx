import { Button } from "@/components/ui/button";
import React, { useState } from "react";

export default function EventCard() {
    const [open, setOpen] = useState(false);
    return (
        <div className="w-full">
            <div
                className={`flex items-center bg-white border border-gray-300 rounded-lg cursor-pointer 
                    ${open ? "border-b-0 rounded-lg rounded-b-none" : "shadow-md"}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                <div className="flex-1 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Maple Festival | Supper high Pool back | 2025-10-22 9:00 ～ 2025-10-28 18:00
                    </h2>
                </div>
                <div className="px-4">
                    <span className={`inline-block transform transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"}`}>
                        ▶
                    </span>
                </div>
            </div>
            {open && (
                <div className="border-x border-b border-gray-300 rounded-b-lg px-6 py-4">
                    <div className="flex flex-row items-between justify-end gap-2">
                        <Button className="bg-blue-500 text-white px-4 py-5
                        font-bold rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                            Update
                        </Button>
                        <Button variant={'outline'}
                        className="text-red-500 font-bold bg-gray-200 cursor-pointer px-4 py-5 ">
                            Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}