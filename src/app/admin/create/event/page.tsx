import CreateEventForm from "./create_event_form";

function EventPage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-start gap-8">
            <CreateEventForm />
        </div>
    )
}

export default EventPage;