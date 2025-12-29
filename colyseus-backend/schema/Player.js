import { Schema, ArraySchema, type } from '@colyseus/schema';

export class Player extends Schema {
  constructor(username) {
    super();
    this.username = username;
    this.pos = new ArraySchema(0, 0, 0);
    this.rot = new ArraySchema(0, 0, 0);
    this.anim = 3;
  }
}

type('string')(Player.prototype, 'username');
type(['number'])(Player.prototype, 'pos');
type(['number'])(Player.prototype, 'rot');
type('number')(Player.prototype, 'anim');