(function() {
  return {
    events: {
      'app.activated': 'onActivated',
      'app.created': 'onCreated',
      'click .kill': 'killSession',
      'app.willDestroy': 'willDestroy'
    },
    requests: {
      getUserSessions: function(id) {
        return {
          url: helpers.fmt('/api/v2/users/%@/sessions.json', id),
          success: this.gotSessions
        };
      },
      deleteSession: function(userId, sessionId) {
        return {
          url: helpers.fmt('/api/v2/users/%@/sessions/%@.json', userId, sessionId),
          type: 'DELETE',
          success: this.killedSession
        };
      }
    },
    onActivated: function(data) {
      if(this._fresh()) {
        console.log('Sessions - cache used');
        this.renderSessions( this.store( 'sessions_' + this._user().id) );
        return;
      }
      this.ajax('getUserSessions', this._user().id);
      this.lastFetched = new Date().getTime();
      this.store('last_fetched', this.lastFetched);
    },
    onCreated: function() {
      this.$('section').parent('.app_view').css({
        'padding-bottom'  : 0,
        'padding-left'    : 0,
        'padding-right'   : 0,
        'padding-top'     : 0,
        'width'           : '350px'
      });
      this.hideConditionally();
    },
    gotSessions: function(res) {
      this.renderSessions(res.sessions);
      this.store( 'sessions_' + this._user().id, res.sessions);
    },
    renderSessions: function(sessions) {
      sessions = _.each(sessions, function(session) {
        session.ago = moment(session.last_seen_at).fromNow();
        session.last_seen_at_epoch = new Date(session.last_seen_at).getTime();
      });
      sessions = _.sortBy(sessions, 'last_seen_at_epoch').reverse();
      // console.dir(sessions);
      this.switchTo('sessions', {
        sessions: sessions,
        name: this._user().name
      });
      this.$('[data-toggle="tooltip"]').tooltip();
    },
    killSession: function(e) {
      var sessionId = e.currentTarget.dataset.sessionId,
        userId = e.currentTarget.dataset.userId;
      this.ajax('deleteSession', userId, sessionId);
    },
    killedSession: function() {
      services.notify('Session terminated.');
      this.ajax('getUserSessions', this._user().id);
    },

    hideConditionally: function() {
      if(this.currentLocation() == 'user_sidebar' && this.setting('hide_on_user')) {
        this.hide();
      } else if(this.currentLocation() == 'ticket_sidebar' && this.setting('hide_on_ticket')) {
        this.hide();
      }
    },
    willDestroy: function() {
      this.store('last_fetched', null);
    },
    _user: function() {
      if(this.currentLocation() == 'user_sidebar') {
        return {
          name: this.user().name(),
          id: this.user().id()
        };
      } else if(this.currentLocation() == 'ticket_sidebar') {
        return {
          name: this.ticket().requester().name(),
          id: this.ticket().requester().id()
        };
      }
    },
    _fresh: function() {
      var now = new Date().getTime();
      if(this.store('last_fetched')) {
        return this.store('last_fetched') > now - 300000;//300000
      } else {
        return false;
      }
      
    }
  };

}());
