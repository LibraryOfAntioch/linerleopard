This is project follows the Tennessee Department of Transportation's (TDOT) methodology in the Drainage Design Manual Chapter 5 for determining the need of a ditch liner. Currently, it only reports the resulting shear force. The user will take that information
and select the appropriate liner type accordingly. This is a drastic improvement to the guesswork iterations performed by hand or with Excel. I created a more exuastive tool on Excel that takes you straight to the correct liner
but in desiring to allow designers to choose for themselves, knowing full well that another type of liner may suit a ditch for case-by-case reasons, I've decided to keep this tool simpler.

This tool is an improvement from the Excel spreadsheet primarily becuase it stops rampant, unmanaged change to the tool. Over time, spreadsheets mutate and there is no way to control if users are using the most up-to-date version.
In addition, I desired to remove the ability for users to unhide tabs, peel back the formulas, manipulate cells, and make their own edits. I wanted a tool that can stand on its own two feet, that can report its work in a reviewable manner,
and can serve as an additional check to a designer's ditch.

This tool will print the screen to a PDF, showing the inputs, every 100th iteration, and the final results. This is a clean report that the designer can keep in their project folder for future documentation as a dead document. Presently, many designers
place spreadsheets as docuemtation of old calculations. This creates a threat of future manipulation with no way to recover the original calculation. A dead document, however, is what it sounds like, dead.

This tool takes the inputs, assumes a retardance class C per TDOT's methodology and a ditch depth of 0.01. If the calculated flow rate does not fall within a 0.1 CFS tollerance, then it will increase the depth by 0.01 and repeat the process until
it has found a depth that satisfies the tollerance. This currently has a max itteration of 2000 trials, which is 20 feet.
