'use strict';

chrome.action.onClicked.addListener(function (tab) {
  if (!tab || !tab.id) return;
  function startPick() {
    chrome.tabs.sendMessage(tab.id, { type: 'C2S_PICK' }).catch(function () {});
  }
  chrome.tabs.sendMessage(tab.id, { type: 'C2S_PICK' }).catch(function () {
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, files: ['converter.js', 'content.js'] },
      function () {
        if (chrome.runtime.lastError) return;
        chrome.tabs.sendMessage(tab.id, { type: 'C2S_PICK' }).catch(function () {});
      }
    );
  });
});
