import { Input } from "@/components/ui/input";

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

            </form>
        </div>
        </div>
    )
}

export default CreateEventForm;