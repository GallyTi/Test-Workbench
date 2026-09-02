import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { StepLockService } from './step-lock.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly lockService: StepLockService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Klient pripojený k WebSocketu: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Klient odpojený: ${client.id}`);
  }

  @SubscribeMessage('join_test_run')
  handleJoinRun(@MessageBody() data: { testRunId: string }, @ConnectedSocket() client: Socket) {
    client.join(`run:${data.testRunId}`);
    this.logger.log(`Socket ${client.id} sa pripojil do miestnosti run:${data.testRunId}`);
    return { status: 'joined', room: `run:${data.testRunId}` };
  }

  @SubscribeMessage('lock_step')
  async handleLockStep(
    @MessageBody() data: { stepExecutionId: string; userId: string; userName: string; testRunId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const lockResult = await this.lockService.acquireLock(data.stepExecutionId, data.userId, data.userName);

    if (lockResult.acquired) {
      this.server.to(`run:${data.testRunId}`).emit('step_locked', {
        stepExecutionId: data.stepExecutionId,
        userId: data.userId,
        userName: data.userName,
      });
      return { success: true };
    } else {
      return { success: false, lockedBy: lockResult.lockedBy };
    }
  }

  @SubscribeMessage('unlock_step')
  async handleUnlockStep(
    @MessageBody() data: { stepExecutionId: string; userId: string; testRunId: string },
  ) {
    const released = await this.lockService.releaseLock(data.stepExecutionId, data.userId);
    if (released) {
      this.server.to(`run:${data.testRunId}`).emit('step_unlocked', {
        stepExecutionId: data.stepExecutionId,
      });
    }
    return { success: released };
  }

  broadcastStepUpdate(testRunId: string, payload: any) {
    this.server.to(`run:${testRunId}`).emit('step_updated', payload);
  }
}
