
function autosearch(query){
  if(query == current_search && current_page == 1 && search_outdated == false){
    document.getElementById('suggest').style.display = '';
    searchmode(0);
    current_page = 0;
    search_container.style.display = '';
    if(!opt.no_scrollhistory){
//      document.body.scrollTop = searchscroll;
      scrollTo(0, searchscroll)
    }
    if(!opt.multipane){
      wave_container.style.display = 'none';
      msg = {};
      wave_container.innerHTML = '';
    }
  }else{  
    current_search = document.forms.searchbox.query.value = query;
    update_search();
  }
  document.getElementById('floating_menu').style.display = 'none';
}

function searchmode(mode){
  //return //it appears most computers cant do it
  //change the little back button icon in ways which iPhone cant do
  
  //if(mobilewebkit) return;
  //document.getElementById("search_go").style.display = mode?"none":"";
  //document.getElementById("search_back").style.display = mode?"":"none";
}



opt.x.recursive_renderer = 'Use old version of tree wave renderer, only works on Wave Protocol 0.21 or below';
opt.x.no_sig = 'Do not automatically add <i>posted with micro-wave</i> signature';


opt.x.owner_utils = 'Enable utilities for wave creators';
opt.x.no_autoscroll = 'Disable smart autoscroll to latest blip';

function set_user_mode(mode){
  var wavehost = username.replace(/^.+@/,'');
  msg.data.waveletData.participants.slice(1).forEach(function(i){ //not creator
    wave.wavelet.modifyParticipantRole(i,mode||'READ_ONLY', current_wave, msg.data.waveletData.waveletId);
    alert('done setting '+(msg.data.waveletData.participants.length -1) + ' people as '+(mode||'READ_ONLY'));
  }); 
  runQueue()
}



function add_tag(){
  var tag = prompt('Add tag');
  if(tag){
    wave.wavelet.addTag(tag, msg.data.waveletData.waveId, msg.data.waveletData.waveletId);
    loadWave(msg.data.waveletData.waveId);
    auto_reload = true;
    runQueue();
  }
}



function update_search(startIndex){
  current_page  = 0;
  var loadId = loading(current_search);
  msg = {};
  
  extend_search(0, function(){
    loading(loadId);
    document.getElementById('suggest').style.display = '';
    search_container.innerHTML = '';
    searchmode(0);
    search_container.style.display = '';
    if(!opt.multipane){
      wave_container.style.display = 'none';
      wave_container.innerHTML = '';
    }
  });
}

function auto_extend(bar){
  bar.innerHTML = "Loading..."
  extend_search(searchLastIndex + 42, function(){
    bar.parentNode.removeChild(bar);
  });
  runQueue();
}




if(!window.resultClass){
	window.resultClass =function(waveId){
		return ''
	}
}

function extend_search(startIndex, callback){
  searchLastIndex = startIndex;
  search_outdated = false;
  callbacks[wave.robot.search(current_search,startIndex||0,42)] = function(data){
    if(callback)callback();
    msg = data; //globalization is good
    console.log(msg);
    var shtml = '';
    var item, digests = msg.data.searchResults.digests;
    if(opt.prefetch){
      var itemIndex = 0;
      setTimeout(function(){
        var item = digests[itemIndex++];
        if(item){
          var  waveletId = item.waveId.replace(/[\/!].+/,'!conv+root');
          callbacks[wave.robot.fetchWave(item.waveId, waveletId)] = function(d){
            if(d){
              prefetched_waves[item.waveId] = d;
            }
            return true;
          }
          runQueue();
          setTimeout(arguments.callee, 500);
        }
      },1000)
    }
    for(var i = 0; i < digests.length; i++){
      item = digests[i];
      item.title = item.title.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
      item.snippet = item.snippet.replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
      unread_blips[item.waveId] = item.unreadCount;
      
      if(opt.old_results){
        shtml += '<a href="#wave:'+item.waveId+'" class="searchlink" onclick=\'ch(this)\'><div class="search"><b>' + item.title+"</b> <span style='color:gray'>"+ item.snippet +"</div></a>";
      }else{
        var msg = item.unreadCount>0?("<span class='unread_msg'><span class='bubble'>"+item.unreadCount+"</span> of "+item.blipCount+"</span>")
        :("<span class='read_msg'>"+item.blipCount+" msgs</span>");
        var time = format_time(item.lastModified);
        var content = '<div class="search '+resultClass(item.waveId)+'"><div class="date">'+time+'<br>'+msg+'</div><span class="title_'+(item.unreadCount > 0 ? "unread": "read")+'">' + item.title+"</span> <span class='snippet'>"+ item.snippet +"</span></div>";
        
        if(item.waveId.indexOf('treq') != -1){
          shtml += '<a class="searchlink">'+content+'</a>'
        }else{
          shtml += '<a href="#wave:'+item.waveId+'" class="searchlink" onclick=\'ch(this)\'>'+content+'</a>';
        }
      }
    }
    search_container.innerHTML += shtml;
    if(digests.length < 42){
      if(digests.length == 0){
        if(current_search.indexOf("is:unread") != -1){
          search_container.innerHTML += "<div class='footer'><b>Yay</b>, no unread items!</div>"
        }else{
          search_container.innerHTML += "<div class='footer'>Your search query has <b>zero results</b>. Try broaden your search?</div>"
        }
      }else{
        search_container.innerHTML += "<div class='footer'><b>Hooray!</b> You've reached the end of the universe!</div>"
      }
    }else{
      search_container.innerHTML += '<div class="footer" onclick="auto_extend(this);"><b>Extend</b> Search (Page '+((startIndex/42)+1)+')</div>';
    }
    
  }
}