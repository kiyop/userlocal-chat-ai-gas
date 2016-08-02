(function(global) {
  global.UserLocalChatAi = (function() {
    function UserLocalChatAi(config) {
      if (typeof config == 'string') {
        config = { apiKey: config };
      }
      this.baseUrl = config.baseUrl || 'https://chatbot-api.userlocal.jp/api';
      this.apiKey = config.apiKey;
      this.headers = {};
    };

    UserLocalChatAi.prototype.snakeToCamel_ = function(s) {
      return s.replace(/(_\w)/g, function(m) {
        return m[1].toUpperCase();
      });
    };

    UserLocalChatAi.prototype.toObject_ = function(src) {
      if (typeof src !== 'object' || Array.isArray(src)) {
        return src;
      }
      var dst = {};
      for (var key in src) {
        dst[this.snakeToCamel_(key)] = this.toObject_(src[key])
      }
      return dst;
    };

    UserLocalChatAi.prototype.sendRequest_ = function(method, url, query, payload) {
      query['key'] = this.apiKey;
      var opt = {
        'method': method,
        'headers': this.headers,
        'muteHttpExceptions': true,
      };
      if (method == 'post' && payload) {
        opt['contentType'] = 'application/json; charset=utf-8';
        opt['payload'] = JSON.stringify(payload);
      }

      var p = [];
      for (var k in query) {
        p.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
      }
      var res = UrlFetchApp.fetch(url + '?' + p.join('&'), opt);
      if (res && res.getResponseCode() == 200) {
        try {
          data = JSON.parse(res.getContentText());
          if (data.status == 'success') {
            return this.toObject_(data.result);
          }
        } catch(error) {}
      }
      return false;
    };

    UserLocalChatAi.prototype.get_ = function(url, query) {
      return this.sendRequest_('get', url, query, {});
    };

    UserLocalChatAi.prototype.post_ = function(url, query, payload) {
      return this.sendRequest_('post', url, query, payload);
    };

    // 自動会話
    UserLocalChatAi.prototype.chat = function(message, userId, options) {
      options = options || {};
      var query = { 'message': message, 'user_id': userId || '' };
      if (options.userName) {
        query['user_name'] = options.userName;
      }
      if (options.botName) {
        query['bot_name'] = options.botName;
      }
      if (options.platform) {
        var platformTypes = ['line', 'tw', 'fb', 'slack'];
        for (var i in platformTypes) {
          if (options.platform == platformTypes[i]) {
            query['platform'] = options.platform;
          }
        }
      }
      return this.get_(this.baseUrl + '/chat', query);
    }

    // キャラクター会話変換
    UserLocalChatAi.prototype.characterize = function(message, type) {
      var characterTypes = ['cat', 'dog', 'roujin'];
      for (var i in characterTypes) {
        if (type == characterTypes[i]) {
          return this.get_(this.baseUrl + '/character', {
            'message': message,
            'character_type': type,
          });
        }
      }
      return false;
    }

    // 氏名識別
    UserLocalChatAi.prototype.parseName = function(name) {
      return this.get_(this.baseUrl + '/name', { 'name': name });
    }

    // 形態素解析
    UserLocalChatAi.prototype.parseText = function(text, options) {
      options = options || {}
      query = { 'message': text };
      if (options.detail) {
        query['detail'] = 'true';
      }
      if (options.cutLastWord) {
        query['cut_last_word'] = 'true';
      }
      return this.get_(this.baseUrl + '/decompose', query);
    }

    return UserLocalChatAi;
  })();
})(this);

function factory(config) {
  return new UserLocalChatAi(config);
};

