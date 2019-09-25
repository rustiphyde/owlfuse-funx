let db = {
  users: [
    {
      userId: 'WniXVQLSLyM4q5HTKVuwWFGPyk2',
      email: 'user@example.com',
      alias: 'Generic Alias',
      clozang: '>generic-alias',
      createdAt: '2019-07-12T20:45:02.580Z',
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/owlfuse-app.appspot.com/o/No-owlfuse-pic.png?alt=media',
      bio: 'Hello, my name is Rusty, and I am the creator of Owlfuse.',
      website: 'https://github.com/rustiphyde',
      location: 'St. Louis, MO'
    }

  ],
  sparks: [
    {
      alias: "Fake Username",
      clozang: ">fake-username",
      body: "spark body",
      createdAt: "2019-07-12T17:19:04.980Z",
      heat: 6,
      stokeCount: 2
    }
  ],
  stokes: [
    {
      alias: "Generic User",
      clozang: ">generic-user",
      sparkId: "9gDkPmho8hbRLf1J2IIB",
      body: "Stoke body goes here",
      createdAt: "2019-07-14T07:20:41:926Z"
    }
  ],
  sizzles: [
    {
        recipient: "Rusty",
        sender: "Other User",
        read: "true | false",
        sparkId: "9gDkPmho8hbRLf1J2IIB",
        type: "heat | stoke",
        createdAt: "2019-07-16T01:32:12.408Z"
    }
  ]
};

const userDetails = {
  // Redux data
  credentials: {
      userId: "WniXVQLSLyM4q5HTKVuwWFG2Pyk2",
      email: "user@example.com",
    alias: "Generic User",
      clozang: ">generic-user",
      createdAt: "2019-07-12T20:45:02.580Z",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/owlfuse.appspot.com/o/No-owlfuse-pic.png?alt=media",
      bio: "Hi, My name is Generic User",
      website: "http://github.com/rustiphyde",        
      location: "St. Louis, MO"        
  },
  heat: [
      {
          alias: 'Rusty',
          sparkId: "9gDkPmho8hbRLf1J2IIB"
      },
      {
          alias: "User 2",
          sparkId: "lSqXGaLI4e501rFodYy5"
      }
  ]
}
