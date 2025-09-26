function DealedTable(){
    return (
        <div className="flex flex-col w-full h-full mb-[20px]">
            <p className="text-lg font-semibold text-black-800 mb-6">
                Dealed Cards
            </p>

            <table >
                <thead>
                    <tr className="border-b border-gray-300">
                        <th className="text-left pb-2">Card Rank</th>
                        <th className="text-left pb-2">Count</th>
                        <th className="text-left pb-2">Distribution</th>
                        <th className="text-left pb-2">Reward</th>
                        <th className="text-left pb-2">Win Rate</th>
                        <th className="text-left pb-2">Pool Allocation</th>
                        <th className="text-left pb-2">Reward Allocation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200">
                        <td className="py-2">SSR</td>
                        <td className="py-2">100</td>
                        <td className="py-2">10</td>
                        <td className="py-2">1000 Coins</td>
                        <td className="py-2">5</td>
                        <td className="py-2">50</td>
                        <td className="py-2">30</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                        <td className="py-2">SR</td>
                        <td className="py-2">300</td>
                        <td className="py-2">30</td>
                        <td className="py-2">300 Coins</td>
                        <td className="py-2">15</td>
                        <td className="py-2">30</td>
                        <td className="py-2">20</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                        <td className="py-2">Total</td>
                        <td className="py-2">300</td>
                        <td className="py-2">30</td>
                        <td className="py-2">300 Coins</td>
                        <td className="py-2">15</td>
                        <td className="py-2">30</td>
                        <td className="py-2">20</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default DealedTable