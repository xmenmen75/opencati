"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const sideBarItems = {
        "main": [
            {
                "name": "📋 Event List",
                "href": "/admin/events",
            }
        ],
        "tools": [
            {
                "name": "➕ + New Event",
                "href": "/admin/create/event",
            },
            {
                "name": "🎯 + New Cards",
                "href": "/admin/create/card",
            },
            {
                "name": "Reference",
                "href": "/admin/reference",
            }
        ]
    }
    
    return (
        <aside
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col z-30
                md:translate-x-0 transition-transform duration-300
                md:w-64 w-56
                sm:w-48
                px-4 py-6"
        >
            <div className="mb-8 flex items-start justify-start flex-col space-y-4">
                <span className="text-2xl font-bold text-gray-800">Event Admin</span>
                <span className="text-md font-bold text-gray-400">Management Dashboard</span>
            </div>
            <nav className="flex-1">
                <ul className="space-y-2">
                    {sideBarItems.main.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                        <Link href={item.href} key={item.name}>
                            <li key={item.name}>
                                <p className={`block px-3 py-2 rounded-lg ${!isActive && "hover:bg-blue-50"} 
                                ${isActive ? "text-white" : "text-gray-700"} font-bold ${isActive ? 'bg-blue-500' : ''}
                                text-xl`}> {item.name} </p>
                            </li>
                        </Link>
                    )})}

                    <hr className="border-t border-gray-200 my-2" />

                    {sideBarItems.tools.map((item) => (
                        <li key={item.name}>
                            <a href={item.href} className="block px-3 py-2 rounded-lg hover:bg-blue-50 
                            text-gray-700 font-bold
                            text-xl"> {item.name} </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
}