import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import React from "react";

export default function CreateCardForm() {
  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white shadow-lg rounded-lg p-8 pt-2">
        <h1 className="text-2xl font-bold mb-4 text-left">Entry New Card</h1>
        <h2 className="text-lg font-semibold mb-6 text-gray-700">Card Attributes</h2>
        <form>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                maxLength={30}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter card name"
              />
            </div>
            <div>
              <label htmlFor="cardRank" className="block text-sm font-medium text-gray-700 mb-1">Card Rank</label>
              <Select name="cardRank" required>
                <SelectTrigger className="w-full px-3 py-5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="S">S</SelectItem>
                  <SelectItem value="SS">SS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="attack" className="block text-sm font-medium text-gray-700 mb-1">Attack (NI)</label>
              <input
                type="number"
                id="attack"
                name="attack"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="hp" className="block text-sm font-medium text-gray-700 mb-1">HP</label>
              <input
                type="number"
                id="hp"
                name="hp"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="selfHeal" className="block text-sm font-medium text-gray-700 mb-1">Self-Heal</label>
              <input
                type="number"
                id="selfHeal"
                name="selfHeal"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="areaAttack" className="block text-sm font-medium text-gray-700 mb-1">Area Attack</label>
              <input
                type="number"
                id="areaAttack"
                name="areaAttack"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="speed" className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
              <input
                type="number"
                id="speed"
                name="speed"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
              <input
                type="number"
                id="cost"
                name="cost"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="specialAbility" className="block text-sm font-medium text-gray-700 mb-1">Special Ability</label>
            <textarea
              id="specialAbility"
              name="specialAbility"
              placeholder="Enter special ability description"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button className="w-full mt-4 cursor-pointer">
            <span className="text-white font-bold">Add Card</span>
          </Button>
        </form>
      </div>
    </div>
  );
}