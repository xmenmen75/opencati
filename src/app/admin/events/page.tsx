"use client"

import EventCard from "./_components/event_card";

function AdminEventsPage() {
    const events = [1,2,3,4]
    return (
        <div className="w-full h-full flex flex-col items-center justify-start
        gap-8">
            {events.map((event) => (
                <EventCard key={event} />
            ))}
        </div>
    )
}

export default AdminEventsPage;