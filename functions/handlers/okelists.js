const { db } = require("../util/admin");

// Build New Oke List
exports.buildNewOkeList = (req, res) => {
  if (req.body.listName.trim() === "")
    return res.status(400).json({ okeList: "Field must not be empty" });
  if (req.body.description.trim() === "")
    return res.status(400).json({ description: "Field must not be empty" });

  const newOkeList = {
    listName: req.body.listName,
    description: req.body.description,
    klozang: req.user.clozang,
    createdAt: new Date().toISOString(),
    songCount: 0
  };

  db.collection("OkeLists")
    .add(newOkeList)
    .then(doc => {
      const resOke = newOkeList;
      resOke.okeId = doc.id;
      res.json(resOke);
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};

exports.getAllOkeLists = (req, res) => {
  db.collection("OkeLists")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let okes = [];
      data.forEach(doc => {
        okes.push({
          okeId: doc.id,
          createdAt: doc.data().createdAt,
          listName: doc.data().listName,
          description: doc.data().description,
          klozang: doc.data().klozang,
          songCount: doc.data().songCount
        });
      });
      return res.json(okes);
    })
    .catch(err => console.log(err));
};

exports.getOke = (req, res) => {
  let okeData = {};
  db.doc(`OkeLists/${req.params.okeId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "OkeList not found" });
      }
      okeData = doc.data();
      okeData.okeId = doc.id;
      return db
        .collection("Songs")
        .where('okeId', '==', req.params.okeId)
        .get();
    })
    .then(data => {
      okeData.songs = [];
      data.forEach(doc => {
        okeData.songs.push(doc.data());
      });
      return res.json(okeData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.addOneSong = (req, res) => {
  if (req.body.songTitle.trim() === "")
    return res.status(400).json({ songTitle: "Field must not be empty" });
  if (req.body.songArtist.trim() === "")
    return res.status(400).json({ songArtist: "Field must not be empty" });

  const newSong = {
    klozang: req.user.clozang,
    songTitle: req.body.songTitle,
    songArtist: req.body.songArtist,
    okeId: req.params.okeId,
    artist: req.body.songArtist.replace(/\s/g, "").toLowerCase()
  };

  db.doc(`/OkeLists/${req.params.okeId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "OkeList does not exist" });
      }
      return doc.ref.update({ songCount: doc.data().songCount + 1 });
    })
    .then(() => {
      return db.collection("Songs").add(newSong);
    })
    .then(() => {
      res.json(newSong);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });
};

exports.getSongsByList = (req, res) => {
  db.collection("Songs")
    .where("okeId", "==", req.params.okeId)
    .get()
    .then(data => {
      let listSongs = [];
      data.forEach(doc => {
        listSongs.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId
        });
      });
      return res.json(listSongs);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getSongsByArtist = (req, res) => {
  db.collection("Songs")
    .where("artist", "==", req.params.artist)
    .get()
    .then(data => {
      let songs = [];
      data.forEach(doc => {
        songs.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      return res.json(songs);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getSongsByClozang = (req, res) => {
  db.collection("Songs")
    .where("klozang", "==", req.params.clozang)
    .get()
    .then(data => {
      let songs = [];
      data.forEach(doc => {
        songs.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      return res.json(songs);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.choozByList = (req, res) => {
  db.collection("Songs")
    .where("okeId", "==", req.params.okeId)
    .get()
    .then(data => {
      let songslist = [];
      data.forEach(doc => {
        songslist.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      console.log(songslist);
      let songChoice = Math.floor(Math.random() * songslist.length);

      let messagesArray = [`The Oke Owl thinks you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. The Oke Owl is wise.`, `Have you ever tried "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}? The Oke Owl thinks it would be wise to try it.`, `The Oke Owl has thought long about this and has decided you should try "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The wise Oke Owl, knowledgeable and sagely, tasks you with singing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Oke Owl has spoken...your song shall be "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Omnipotent Owl of Oke says you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You should heed the wisdom of the Great Oke Owl and sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Owl who is of Oke has pondered this and  has concluded that your song to sing is "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You seek the guidance of the wise Oke Owl? Very well, you shall sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. Now be gone with you!`, `After eons of meditation, The Wise Oke Owl has emerged to ask you to sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`];

      let owlIndex = Math.floor(Math.random() * messagesArray.length);

      return res.json({
        message: `${messagesArray[owlIndex]}`
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(400).json({ error: "Sorry, there are no songs on this list at this" });
    });
};

exports.choozByArtist = (req, res) => {
  db.collection("Songs")
    .where("artist", "==", req.params.artist)
    .get()
    .then(data => {
      let songslist = [];
      data.forEach(doc => {
        songslist.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      console.log(songslist);
      let songChoice = Math.floor(Math.random() * songslist.length);

      let messagesArray = [`The Oke Owl thinks you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. The Oke Owl is wise.`, `Have you ever tried "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}? The Oke Owl thinks it would be wise to try it.`, `The Oke Owl has thought long about this and has decided you should try "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The wise Oke Owl, knowledgeable and sagely, tasks you with singing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Oke Owl has spoken...your song shall be "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Omnipotent Owl of Oke says you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You should heed the wisdom of the Great Oke Owl and sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Owl who is of Oke has pondered this and  has concluded that your song to sing is "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You seek the guidance of the wise Oke Owl? Very well, you shall sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. Now be gone with you!`, `After eons of meditation, The Wise Oke Owl has emerged to ask you to sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`];

      let owlIndex = Math.floor(Math.random() * messagesArray.length);

      return res.json({
        message: `${messagesArray[owlIndex]}`
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(400).json({ error: "Sorry, there are currently no songs by that artist in our database. You are welcome to add one." });
    });
};

exports.choozByClozang = (req, res) => {
  db.collection("Songs")
    .where("klozang", "==", req.params.clozang)
    .get()
    .then(data => {
      let songslist = [];
      data.forEach(doc => {
        songslist.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      console.log(songslist);
      let songChoice = Math.floor(Math.random() * songslist.length);
      
      let messagesArray = [`The Oke Owl thinks you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. The Oke Owl is wise.`, `Have you ever tried "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}? The Oke Owl thinks it would be wise to try it.`, `The Oke Owl has thought long about this and has decided you should try "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The wise Oke Owl, knowledgeable and sagely, tasks you with singing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Oke Owl has spoken...your song shall be "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Omnipotent Owl of Oke says you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You should heed the wisdom of the Great Oke Owl and sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Owl who is of Oke has pondered this and  has concluded that your song to sing is "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You seek the guidance of the wise Oke Owl? Very well, you shall sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. Now be gone with you!`, `After eons of meditation, The Wise Oke Owl has emerged to ask you to sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`];

      let owlIndex = Math.floor(Math.random() * messagesArray.length);

      return res.json({
        message: `${messagesArray[owlIndex]}`
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(400).json({ error: "This user currently has no songs in the database." });
    });
};

exports.choozFromAllSongs = (req, res) => {
  db.collection("Songs")
    .get()
    .then(data => {
      let songslist = [];
      data.forEach(doc => {
        songslist.push({
          songId: doc.id,
          klozang: doc.data().klozang,
          songTitle: doc.data().songTitle,
          songArtist: doc.data().songArtist,
          okeId: doc.data().okeId,
          artist: doc.data().artist
        });
      });
      console.log(songslist);
      let songChoice = Math.floor(Math.random() * songslist.length);

      let messagesArray = [`The Oke Owl thinks you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. The Oke Owl is wise.`, `Have you ever tried "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}? The Oke Owl thinks it would be wise to try it.`, `The Oke Owl has thought long about this and has decided you should try "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The wise Oke Owl, knowledgeable and sagely, tasks you with singing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Oke Owl has spoken...your song shall be "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Omnipotent Owl of Oke says you should sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You should heed the wisdom of the Great Oke Owl and sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `The Owl who is of Oke has pondered this and  has concluded that your song to sing is "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`, `You seek the guidance of the wise Oke Owl? Very well, you shall sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}. Now be gone with you!`, `After eons of meditation, The Wise Oke Owl has emerged to ask you to sing "${
        songslist[songChoice].songTitle
      }" by ${songslist[songChoice].songArtist}.`];

      let owlIndex = Math.floor(Math.random() * messagesArray.length);

      return res.json({
        message: `${messagesArray[owlIndex]}`
      });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong, please try again." });
    });
};

exports.eraseOkelist = (req, res) => {
  const okeToErase = db.doc(`/OkeLists/${req.params.okeId}`);

  okeToErase.get()
      .then(doc => {
          if(!doc.exists){
              return res.status(404).json({ error: 'Okelist not found'});
          } 
          else if(doc.data().userCandle !== req.user.candle){
              return res.status(403).json({ error: 'This action is not permitted by this account'});
          }
          else {
              return okeToErase.delete();
          }
      })
      .then(() => {
          return res.json({ message: 'Okelist erased completely'});
      })
      .catch(err => {
          console.error(err);
          return res.status(500).json({ error: err.code});
      });
}