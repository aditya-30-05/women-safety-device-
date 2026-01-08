import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SosGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('emergency_alert')
    handleEmergencyAlert(client: Socket, payload: any) {
        console.log('Emergency Alert Received:', payload);
        // Broadcast to all connected clients (e.g., helpers, admins)
        this.server.emit('sos_broadcast', {
            ...payload,
            senderId: client.id,
            timestamp: new Date().toISOString(),
        });
        return { status: 'Alert Broadcasted' };
    }
}
