// src/config/passport.config.js
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const AppConfig = require('./app.config');
const Database = require('../database/prisma');

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: AppConfig.jwt.secret
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const prisma = Database.getClient();
        
        const user = await prisma.user.findUnique({
          where: { id: jwt_payload.id },
          select: {
            id: true,
            email: true,
            name: true,
            age: true,
            gender: true,
            height: true,
            weight: true,
            activityLevel: true,
            profileImage: true
          }
        });

        if (user) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};