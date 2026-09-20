export interface MKNetplayRoom {
  id: string;
  code: string;
  title: string;
  core: string;
  romName?: string;
  hostParticipantId: string;
  hostName: string;
  hostNickname: string;
  hostAvatar?: string;
  clientParticipantId?: string;
  clientName?: string;
  clientNickname?: string;
  clientAvatar?: string;
  status: 'waiting' | 'in_game' | 'closed';
  createdAt: number;
  updatedAt: number;
}

class MKNetplayManager {
  private rooms: Map<string, MKNetplayRoom> = new Map();

  constructor() {
    // Add 1 default demo room so players can immediately see how it looks
    const sampleRoom: MKNetplayRoom = {
      id: 'room_sample_1',
      code: 'MK-777',
      title: 'Турнир Негодяев: Смертельная Битва',
      core: 'segaMD',
      romName: 'Ultimate Mortal Kombat 3 (Sega)',
      hostParticipantId: 'sample_host',
      hostName: 'Андрей Самойлов',
      hostNickname: 'Капитан',
      status: 'waiting',
      createdAt: Date.now() - 1000 * 60 * 5,
      updatedAt: Date.now()
    };
    this.rooms.set(sampleRoom.code, sampleRoom);
  }

  public getActiveRooms(): MKNetplayRoom[] {
    const now = Date.now();
    // Prune rooms older than 3 hours
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.updatedAt > 1000 * 60 * 60 * 3) {
        this.rooms.delete(code);
      }
    }
    return Array.from(this.rooms.values()).filter(r => r.status !== 'closed');
  }

  public getRoom(code: string): MKNetplayRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public createOrUpdateRoom(data: Partial<MKNetplayRoom> & { code: string; hostParticipantId: string; hostName: string }): MKNetplayRoom {
    const code = data.code.toUpperCase().trim();
    const existing = this.rooms.get(code);

    const room: MKNetplayRoom = {
      id: existing?.id || 'mk_room_' + Date.now(),
      code,
      title: data.title || existing?.title || `Сетевая комната ${code}`,
      core: data.core || existing?.core || 'segaMD',
      romName: data.romName || existing?.romName || 'Mortal Kombat ROM',
      hostParticipantId: data.hostParticipantId,
      hostName: data.hostName,
      hostNickname: data.hostNickname || existing?.hostNickname || data.hostName,
      hostAvatar: data.hostAvatar || existing?.hostAvatar,
      clientParticipantId: data.clientParticipantId || existing?.clientParticipantId,
      clientName: data.clientName || existing?.clientName,
      clientNickname: data.clientNickname || existing?.clientNickname,
      clientAvatar: data.clientAvatar || existing?.clientAvatar,
      status: (data.clientParticipantId || existing?.clientParticipantId) ? 'in_game' : 'waiting',
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    this.rooms.set(code, room);
    return room;
  }

  public joinRoom(code: string, clientData: { participantId: string; name: string; nickname?: string; avatar?: string }): MKNetplayRoom | null {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) return null;

    room.clientParticipantId = clientData.participantId;
    room.clientName = clientData.name;
    room.clientNickname = clientData.nickname || clientData.name;
    room.clientAvatar = clientData.avatar;
    room.status = 'in_game';
    room.updatedAt = Date.now();

    this.rooms.set(room.code, room);
    return room;
  }

  public closeRoom(code: string): boolean {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) return false;
    room.status = 'closed';
    this.rooms.delete(code.toUpperCase().trim());
    return true;
  }
}

export const mkNetplayManager = new MKNetplayManager();
