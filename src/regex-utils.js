function createPattern() {
  return new RegExp(
    [
      "(?<!\\d)67(?!\\d)",                          //67 not embedded in a larger number
      "(?<!\\d)6[\\.,]7(?!\\d)",                    //6.7 or 6,7 (decimal dot/comma)
      "(?<!\\d)6[\\-\\u2013\\u2014]7(?!\\d)",        //6-7 / 6–7 / 6—7
      "(?<!\\d)6\\s*,\\s*7(?!\\d)",                 //6, 7
      "(?<!\\d)6\\s*[~\\uFF5E\\u301C]\\s*7(?!\\d)",  //6~7 / 6～7 / 6〜7
      "(?<!\\d)6\\s+(?:or|to)\\s+7(?!\\d)",         //6 or 7 / 6 to 7
  
      //English
      "\\bsix[\\s,\\-]+seven\\b",                    //six seven / six-seven / six, seven
      "\\bsix\\s+(?:or|to)\\s+seven\\b",             //six or seven / six to seven
      "\\bsix\\s+point\\s+seven\\b",                 //six point seven
      "\\bsixty[\\s\\-]?seven\\b",                   //sixty seven / sixty-seven
  
      //Chinese
      "六十七",                                       //67
      "六点七",                                       //6.7
      "六\\s*[~\\-—–～〜]\\s*七",                      //六~七 / 六-七 etc
      "六\\s*,\\s*七",                               //六,七
      "六(?:至|到)七",                               //六至七 / 六到七  (to)
      "六或七",                                       //六或七  (or)
      "六七",                                         //六七 (six seven)
  
      //Spanish
      "\\bseis[\\s,\\-]+siete\\b",                   //seis siete / seis-siete / seis, siete
      "\\bseis\\s+(?:o|u)\\s+siete\\b",              //seis o siete (or)
      "\\bseis\\s+a\\s+siete\\b",                    //seis a siete (to)
      "\\bseis\\s+punto\\s+siete\\b",                //seis punto siete
      "\\bseis\\s+coma\\s+siete\\b",                 //seis coma siete
      "\\bsesenta\\s+y\\s+siete\\b",                 //sesenta y siete (67)
  
      
      //French
      "\\bsix[\\s,\\-]+sept\\b",                     //six sept / six-sept / six, sept
      "\\bsix\\s+ou\\s+sept\\b",                     //six ou sept (or)
      "\\b(?:de\\s+)?six\\s+à\\s+sept\\b",           //(de) six à sept (to)
      "\\bsix\\s+(?:virgule|point)\\s+sept\\b",      //six virgule sept / six point sept
      "\\bsoixante[\\s\\-]?sept\\b",                 //soixante-sept / soixante sept (67)
  
      
      //German
      "\\bsechs[\\s,\\-]+sieben\\b",                 //sechs sieben / sechs-sieben / sechs, sieben
      "\\bsechs\\s+oder\\s+sieben\\b",               //sechs oder sieben (or)
      "\\b(?:von\\s+)?sechs\\s+bis\\s+sieben\\b",    //(von) sechs bis sieben (to)
      "\\bsechs\\s+(?:komma|punkt)\\s+sieben\\b",    //sechs komma sieben / sechs punkt sieben
      "\\bsiebenundsechzig\\b",                      //67
  
      
      //Russian
      "\\bшесть[\\s,\\-]+семь\\b",                   //шесть семь / шесть-семь / шесть, семь
      "\\bшесть\\s+или\\s+семь\\b",                  //шесть или семь (or)
      "\\b(?:от\\s+)?шести\\s+до\\s+семи\\b",        //(от) шести до семи (to)  [common case form]
      "\\bшесть\\s+(?:точка|запятая)\\s+семь\\b",    //шесть точка семь / шесть запятая семь
      "\\bшестьдесят\\s+семь\\b",                    //шестьдесят семь (67)
  
      
      //Portuguese
      "\\bseis[\\s,\\-]+sete\\b",                    //seis sete / seis-sete / seis, sete
      "\\bseis\\s+ou\\s+sete\\b",                    //seis ou sete (or)
      "\\b(?:de\\s+)?seis\\s+a\\s+sete\\b",          //(de) seis a sete (to)
      "\\bseis\\s+(?:ponto|vírgula|virgula)\\s+sete\\b", //seis ponto sete / seis vírgula sete
      "\\bsessenta\\s+e\\s+sete\\b",                 //sessenta e sete (67)
  
      
      //Japanese
      "六十七",                                       //67
      "六点七",                                       //6.7
      "六\\s*[~\\-—–～〜]\\s*七",                      //六〜七 etc
      "六\\s*,\\s*七",                               //六,七
      "六(?:から|〜|～|−|ー|—|–)七",                  //六から七 / 六〜七 variants
      "六か七",                                       //六か七 (or)
      "六七",                                         //六七 (six seven)
  
      
      //Korean
      "\\b여섯[\\s,\\-]+일곱\\b",                     //여섯 일곱 / 여섯-일곱 / 여섯, 일곱
      "\\b여섯\\s+(?:또는|혹은)\\s+일곱\\b",           //여섯 또는 일곱 (or)
      "\\b여섯\\s+(?:부터|에서)\\s+일곱\\b",           //여섯부터 일곱 / 여섯에서 일곱 (to)
      "\\b여섯\\s+점\\s+칠\\b",                       //여섯 점 칠 (6.7)
      "\\b육십칠\\b|\\b예순[\\s\\-]?일곱\\b",          //67 (Sino / native)
  
      
      //Indonesian
      "\\benam[\\s,\\-]+tujuh\\b",                   //enam tujuh / enam-tujuh / enam, tujuh
      "\\benam\\s+atau\\s+tujuh\\b",                 //enam atau tujuh (or)
      "\\benam\\s+(?:sampai|hingga)\\s+tujuh\\b",    //enam sampai tujuh (to)
      "\\benam\\s+(?:koma|titik)\\s+tujuh\\b",       //enam koma tujuh / enam titik tujuh
      "\\benam\\s+puluh\\s+tujuh\\b",                //enam puluh tujuh (67)
  
      
      //Turkish
      "\\baltı[\\s,\\-]+yedi\\b",                    //altı yedi / altı-yedi / altı, yedi
      "\\baltı\\s+(?:veya|ya\\s+da)\\s+yedi\\b",      //altı veya yedi / altı ya da yedi (or)
      "\\baltı\\s+(?:ile|den|dan)\\s+yedi\\b",        //loose "to" forms seen in text
      "\\baltı\\s+nokta\\s+yedi\\b",                 //altı nokta yedi (6.7)
      "\\baltmış\\s+yedi\\b",                        //altmış yedi (67)
  
      
      //Hindi
      "छह[\\s,\\-]+सात",                              //छह सात / छह-सात / छह, सात
      "छह\\s+या\\s+सात",                             //छह या सात (or)
      "छह\\s+से\\s+सात",                             //छह से सात (to)
      "छह\\s+(?:दशमलव|बिंदु)\\s+सात",                 //छह दशमलव सात / छह बिंदु सात (6.7)
      "सड़सठ"                                         //67
    ].join("|"),
    "giu"
  );
}

// Expose as a global for non-module content scripts
window.createPattern = createPattern;