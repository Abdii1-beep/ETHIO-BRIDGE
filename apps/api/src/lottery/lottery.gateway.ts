import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LotteryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  notifySpinStart(lotteryId: string) {
    this.server.emit('spin-start', { lotteryId, timestamp: new Date() });
  }

  notifySpinComplete(lotteryId: string, winningTicketId: string) {
    this.server.emit('spin-complete', { lotteryId, winningTicketId, timestamp: new Date() });
  }

  @SubscribeMessage('join-lottery')
  handleJoinLottery(client: Socket, lotteryId: string) {
    client.join(`lottery:${lotteryId}`);
    console.log(`Client ${client.id} joined lottery ${lotteryId}`);
  }

  @SubscribeMessage('leave-lottery')
  handleLeaveLottery(client: Socket, lotteryId: string) {
    client.leave(`lottery:${lotteryId}`);
    console.log(`Client ${client.id} left lottery ${lotteryId}`);
  }
}
