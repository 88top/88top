# First sandbox transport failure

The initial B sandbox produced no decoded JSON because the test harness attempted to use `base64`, absent on the target. The Python assertion raised `TypeError: 'NoneType' object is not subscriptable` before deployment. Subsequent check2 and diagnostic artifacts retained the empty transport fields and `sh: base64: not found`. No product script was deployed by these failed harness runs; temporary sandbox paths were removed by trap.

The harness was corrected to transfer the JSON directly. Ten status cases and the real B update passed in script-round-2. This was a test transport correction, not a service restart or production fault injection.
