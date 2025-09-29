import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";

function CreateEventForm() {
    return (
        <div className="w-full max-w-2xl">
        <div className="bg-white shadow-lg rounded-lg p-8 pt-2">
            <h1 className="text-2xl font-bold mb-4 text-left">Create New Event</h1>

            <form className="flex flex-col gap-4">
                <div>
                <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                </label>
                <Input
                    type="text"
                    id="cardName"
                    name="cardName"
                    maxLength={30}
                    required
                    className="w-full focus:ring-3 focus:ring-gray-300"
                    placeholder="Enter event name"
                />
                </div>

                <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                </label>
                <Input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    maxLength={30}
                    required
                    className="w-full focus:ring-3 focus:ring-gray-300"
                    placeholder="Enter subtitle"
                />
                </div>

                <div className="flex flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date & Time (UTC+8)
                        </label>
                        <div className="flex flex-row gap-2">
                            <Input
                                type="date"
                                id="startDate"
                                name="startDate"
                                required
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                            <Input
                                type="time"
                                id="startTime"
                                name="startTime"
                                required
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                            End Date & Time (UTC+8)
                        </label>
                        <div className="flex flex-row gap-2">
                            <Input
                                type="date"
                                id="endDate"
                                name="endDate"
                                required
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                            <Input
                                type="time"
                                id="endTime"
                                name="endTime"
                                required
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="requiredCATI" className="block text-sm font-medium text-gray-700 mb-1">
                            一回Openの必要CATI
                        </label>
                        <Input
                            type="number"
                            id="requiredCATI"
                            name="requiredCATI"
                            min={0}
                            className="w-full focus:ring-3 focus:ring-gray-300"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="eventReward" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Reward
                        </label>
                    <Input
                        type="number"
                        id="eventReward"
                        name="eventReward"
                        min={0}
                        className="w-full focus:ring-3 focus:ring-gray-300"
                    />
                    </div>
                    
                </div>

                <div>
                    <h3 className="text-md font-semibold">
                        Card pool allocation
                    </h3>
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="SS_cp" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                SS
                            </label>
                            <Input
                                type="number"
                                id="SS_cp"
                                name="SS_cp"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="S_cp" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                S
                            </label>
                            <Input
                                type="number"
                                id="S_cp"
                                name="S_cp"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="AA_cp" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                AA
                            </label>
                            <Input
                                type="number"
                                id="AA_cp"
                                name="AA_cp"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="A_cp" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                A
                            </label>
                            <Input
                                type="number"
                                id="A_cp"
                                name="A_cp"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Award allocation */}
                <div>
                    <h3 className="text-md font-semibold">
                        Award allocation
                    </h3>
                    <div className="flex flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="SS_award" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                SS
                            </label>
                            <Input
                                type="number"
                                id="SS_award"
                                name="SS_award"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="S_award" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                S
                            </label>
                            <Input
                                type="number"
                                id="S_award"
                                name="S_award"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="AA_award" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                AA
                            </label>
                            <Input
                                type="number"
                                id="AA_award"
                                name="AA_award"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="A_award" 
                            className="block text-sm font-medium text-gray-700 mb-1">
                                A
                            </label>
                            <Input
                                type="number"
                                id="A_award"
                                name="A_award"
                                min={0}
                                className="w-full focus:ring-3 focus:ring-gray-300"
                            />
                        </div>
                    </div>
                </div>
                <div className="w-full mt-8">
                    <label htmlFor="openingMovie" 
                    className="text-md font-semibold">
                        Opening Movie
                    </label>
                    <label className="block">
                        <div className="w-full h-40 flex flex-col items-center justify-center border-2 border-dotted border-gray-400 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <span className="text-2xl mb-2">
                                ⬆️
                            </span>
                            <span className="text-md font-medium text-gray-700 mb-2">
                                Click to upload opening movie
                            </span>
                            <span className="text-xs text-gray-500">MP4, MOV up to 50MB</span>
                        </div>
                        <input type="file" accept="video/mp4,video/quicktime" className="hidden" />
                    </label>
                </div>
                <div>
                    <h3 className="text-md font-semibold">
                        Added cards
                    </h3>

                    <table className="min-w-full divide-y divide-gray-200 mt-2">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="text-left text-sm pb-2">Card No</th>
                                <th className="text-left text-sm pb-2">Avatar</th>
                                <th className="text-left text-sm pb-2">Card Name</th>
                                <th className="text-left text-sm pb-2">Card Rank</th>
                                <th className="text-left text-sm pb-2">Win Rate</th>
                                <th className="text-left text-sm pb-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200">
                                <td className="py-2">1</td>
                                <td className="py-2">
                                    {/* avatar */}
                                </td>
                                <td className="py-2">Black Soldier</td>
                                <td className="py-2">
                                    <p className="w-fit text-center rounded-sm p-1
                                    bg-blue-200 text-blue-800">SS</p>
                                </td>
                                <td className="py-2">
                                    <Input 
                                        type="number"
                                        id="winRate"
                                        name="winRate"
                                        min={0}
                                        className="w-20 focus:ring-3 focus:ring-gray-300"
                                    />
                                </td>
                                <td className="py-2">
                                    <Button
                                    variant={'outline'}
                                    className="px-4 py-2 rounded-lg cursor-pointer">
                                        Delete
                                    </Button
                                    >
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                                <td className="py-2">1</td>
                                <td className="py-2">
                                    {/* avatar */}
                                </td>
                                <td className="py-2">Black Soldier</td>
                                <td className="py-2">
                                    <p className="w-fit text-center rounded-sm p-1
                                    bg-blue-200 text-blue-800">SS</p>
                                </td>
                                <td className="py-2">
                                    <Input 
                                        type="number"
                                        id="winRate"
                                        name="winRate"
                                        min={0}
                                        className="w-20 focus:ring-3 focus:ring-gray-300"
                                    />
                                </td>
                                <td className="py-2">
                                    <Button
                                    variant={'outline'}
                                    className="px-4 py-2 rounded-lg cursor-pointer">
                                        Delete
                                    </Button
                                    >
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="w-full flex items-center justify-center">
                        <Button variant="outline" className="w-12 mt-4 cursor-pointer">
                            <PlusIcon />
                        </Button>
                    </div>
                </div>
                <div className="w-full mt-2 flex items-end justify-end">
                    <Button 
                    className="px-4 py-3 cursor-pointer">
                        SAVE
                    </Button>
                </div>
        </form>
        </div>
        </div>
    )
}

export default CreateEventForm;