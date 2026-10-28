// Emit literal method/path registrations, including aliases and generic route
// helpers. Dynamic registrations must be checked separately. No build deps.
package main

import (
	"encoding/json"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type route struct {
	Method string `json:"method"`
	Path   string `json:"path"`
	Source string `json:"source"`
}

func functionName(expr ast.Expr) string {
	switch e := expr.(type) {
	case *ast.SelectorExpr:
		return e.Sel.Name
	case *ast.Ident:
		return e.Name
	case *ast.IndexExpr:
		return functionName(e.X)
	case *ast.IndexListExpr:
		return functionName(e.X)
	}
	return ""
}

func literals(expr ast.Expr) []string {
	switch e := expr.(type) {
	case *ast.BasicLit:
		if e.Kind == token.STRING {
			if v, err := strconv.Unquote(e.Value); err == nil {
				return []string{v}
			}
		}
	case *ast.CompositeLit:
		var out []string
		for _, item := range e.Elts {
			out = append(out, literals(item)...)
		}
		return out
	}
	return nil
}

func main() {
	if len(os.Args) != 2 {
		panic("usage: route-inventory SOURCE_ROOT")
	}
	root := os.Args[1]
	set := map[string]route{}
	err := filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		fset := token.NewFileSet()
		file, err := parser.ParseFile(fset, path, nil, 0)
		if err != nil {
			return err
		}
		ast.Inspect(file, func(n ast.Node) bool {
			call, ok := n.(*ast.CallExpr)
			if !ok {
				return true
			}
			name := strings.ToLower(functionName(call.Fun))
			method := ""
			for _, m := range []string{"get", "post", "put", "delete", "patch", "head", "options"} {
				if strings.HasPrefix(name, m) {
					method = strings.ToUpper(m)
					break
				}
			}
			if name == "servefiles" {
				method = "GET"
			}
			if method == "" {
				return true
			}
			for _, arg := range call.Args {
				for _, p := range literals(arg) {
					if !strings.HasPrefix(p, "/cgi-bin/luci/istore/") && !strings.HasPrefix(p, "/api/") {
						continue
					}
					key := method + " " + p
					if _, ok := set[key]; !ok {
						set[key] = route{method, p, fset.Position(call.Pos()).String()}
					}
				}
			}
			return true
		})
		return nil
	})
	if err != nil {
		panic(err)
	}
	out := make([]route, 0, len(set))
	for _, r := range set {
		out = append(out, r)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path+out[i].Method < out[j].Path+out[j].Method })
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(out); err != nil {
		panic(err)
	}
}
