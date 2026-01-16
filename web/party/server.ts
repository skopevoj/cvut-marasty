import type * as Party from "partykit/server";

export default class QuizRoomServer implements Party.Server {
    constructor(readonly room: Party.Room) { }

    onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        // Notify existing connections about new user
        this.room.broadcast(
            JSON.stringify({
                type: 'user-joined',
                data: { userId: conn.id },
                senderId: conn.id
            }),
            [conn.id] // Exclude the new connection
        );

        console.log(`[PartyKit] User ${conn.id} connected to room ${this.room.id}. Total: ${[...this.room.getConnections()].length}`);
    }

    onMessage(message: string, sender: Party.Connection) {
        // Broadcast message to all other connections
        this.room.broadcast(message, [sender.id]);
        console.log(`[PartyKit] Broadcasting message from ${sender.id} to ${[...this.room.getConnections()].length - 1} peers`);
    }

    onClose(conn: Party.Connection) {
        // Notify remaining connections about user leaving
        this.room.broadcast(
            JSON.stringify({
                type: 'user-left',
                data: { userId: conn.id },
                senderId: conn.id
            })
        );
        console.log(`[PartyKit] User ${conn.id} disconnected from room ${this.room.id}`);
    }
}

QuizRoomServer satisfies Party.Worker;
