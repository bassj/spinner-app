import {
    createRoom,
    getRoom,
} from './room';

test('Create a room with no password', async () => {
    const room = await createRoom({ 
        name:     'test_room',
        password: null,
        creator:  'test_user_id'
    }); 

    expect(room.name).toBe('test_room');
    expect(room.creator).toBe('test_user_id');
    expect(room.password).toBe(null);
});

test('Create a room with a password', async () => {
    const room = await createRoom({ 
        name:     'test_room',
        password: 'test_password',
        creator:  'test_user_id'
    }); 

    expect(room.name).toBe('test_room');
    expect(room.creator).toBe('test_user_id');
    expect(room.password).not.toBe(null);
    expect(await room.check_password('test_password')).toBe(true);
});

test('Retrieve a created room', async () => {
    const room = await createRoom({ 
        name:     'test_room',
        password: null,
        creator:  'test_user_id'
    }); 

    expect(getRoom(room.slug)).toBe(room);
});
